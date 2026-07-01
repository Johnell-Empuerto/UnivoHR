const pool = require("../config/db");
const payrollService = require("../services/payroll.service");
const payrollModel = require("../models/payroll.model");
const notificationService = require("../services/notification.service");

const audit = require("../services/audit.service");
const { getUserBranchIds } = require("../utils/branchAccess");
const { ROLES } = require("../constants/roles");
const logger = require("../utils/logger");

const formatPayrollDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
};

const notifyHR = (title, message, referenceId) => {
  payrollModel.getActiveHRUserIds().then(userIds => {
    if (userIds.length === 0) return;
    const promises = userIds.map(uid =>
      notificationService.notify({ user_id: uid, type: "PAYROLL", title, message, reference_id: referenceId })
    );
    Promise.all(promises).catch(err => logger.error({ err }, "[PAYROLL] HR notify error"));
  });
};

const notifyPayrollEmployees = (employeeIds, title, message) => {
  if (employeeIds.length === 0) return;
  payrollModel.getUserIdsByEmployeeIds(employeeIds).then(users => {
    if (users.length === 0) return;
    const promises = users.map(u =>
      notificationService.notify({ user_id: u.id, type: "PAYROLL", title, message, reference_id: null })
    );
    Promise.all(promises).catch(err => logger.error({ err }, "[PAYROLL] bulk notify error"));
  });
};

// Generate Payroll (with branch access)
const generatePayroll = async (req, res, next) => {
  try {
    const { cutoff_start, cutoff_end, pay_date } = req.body;
    const branch_id = req.body.branch_id || null;

    if (req.user.role !== ROLES.ADMIN && !branch_id) {
      return res.status(403).json({ message: "You are not allowed to manage this branch." });
    }

    const data = await payrollService.generatePayroll(
      cutoff_start,
      cutoff_end,
      pay_date,
      branch_id,
    );

    audit.auditLog(req, {
      action: "GENERATE_PAYROLL",
      table_name: "payroll",
      branch_id: branch_id || null,
      new_values: { cutoff_start, cutoff_end, pay_date, branch_id: branch_id || null },
      description: `Payroll generated: ${cutoff_start} to ${cutoff_end}, pay date ${pay_date}${branch_id ? `, branch ${branch_id}` : ""}`,
    });

    const dateRange = `${formatPayrollDate(cutoff_start)} to ${formatPayrollDate(cutoff_end)}`;
    notifyHR("Payroll Generated", `Payroll for ${dateRange} has been generated.`, null);
    payrollModel.getEmployeeIdsByCutoff(cutoff_start, cutoff_end).then(empIds => {
      notifyPayrollEmployees(empIds, "Payslip Available", `Your payslip for ${dateRange} is now available.`);
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Get Payroll (with branch access)
const getPayroll = async (req, res, next) => {
  try {
    const {
      cutoff_start,
      cutoff_end,
      page = 1,
      limit = 10,
      search = "",
    } = req.query;

    const data = await payrollService.getPayroll(
      cutoff_start,
      cutoff_end,
      page,
      limit,
      search,
      req.allowedBranchIds,
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Get Summary (with branch access)
const getPayrollSummary = async (req, res, next) => {
  try {
    const { cutoff_start, cutoff_end } = req.query;

    const data = await payrollService.getPayrollSummary(
      cutoff_start,
      cutoff_end,
      req.allowedBranchIds,
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Employee Salary (with branch access)
const getEmployeeSalary = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    let allowedBranchIds = null;
    if (req.user.role !== ROLES.ADMIN) {
      allowedBranchIds = await getUserBranchIds(req.user.id);
      if (allowedBranchIds.length === 0) {
        return res.status(403).json({ message: "You are not allowed to view this data." });
      }
    }

    const data = await payrollService.getEmployeeSalary(page, limit, search, allowedBranchIds);

    res.json(data);
  } catch (err) {
    next(err);
  }
};

const updateEmployeeSalary = async (req, res, next) => {
  try {
    const id = req.params.id;
    const oldValues = await audit.fetchOldValues("employee_salary", id);
    const data = await payrollService.updateEmployeeSalary(id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "employee_salary",
      record_id: data.id,
      employee_id: Number(id),
      old_values: oldValues ? { basic_salary: oldValues.basic_salary, daily_rate: oldValues.daily_rate, overtime_rate: oldValues.overtime_rate, working_days_per_month: oldValues.working_days_per_month } : null,
      new_values: { basic_salary: data.basic_salary, daily_rate: data.daily_rate, overtime_rate: data.overtime_rate, working_days_per_month: data.working_days_per_month },
      description: `Salary updated for employee ${id}`,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Deductions (with branch access)
const getDeductions = async (req, res, next) => {
  try {
    const { employee_id } = req.params;

    if (req.user.role !== ROLES.ADMIN) {
      const assigned = await getUserBranchIds(req.user.id);
      const empResult = await pool.query(`SELECT branch_id FROM employees WHERE id = $1`, [employee_id]);
      if (empResult.rows.length === 0) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const empBranch = empResult.rows[0].branch_id;
      if (!empBranch || !assigned.includes(empBranch)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const data = await payrollService.getDeductions(employee_id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const createDeduction = async (req, res, next) => {
  try {
    const data = await payrollService.createDeduction(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "employee_deductions",
      record_id: data.id,
      employee_id: data.employee_id,
      new_values: { employee_id: data.employee_id, type: data.type, amount: data.amount, is_active: data.is_active },
      description: `Deduction created: ${data.type} ${data.amount} for employee ${data.employee_id}`,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const updateDeduction = async (req, res, next) => {
  try {
    const oldValues = await audit.fetchOldValues("employee_deductions", req.params.id);
    const data = await payrollService.updateDeduction(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "employee_deductions",
      record_id: Number(req.params.id),
      employee_id: data.employee_id,
      old_values: oldValues ? { type: oldValues.type, amount: oldValues.amount, is_active: oldValues.is_active } : null,
      new_values: { type: data.type, amount: data.amount, is_active: data.is_active },
      description: `Deduction ${req.params.id} updated: ${data.type} ${data.amount}`,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const deleteDeduction = async (req, res, next) => {
  try {
    const oldValues = await audit.fetchOldValues("employee_deductions", req.params.id);
    await payrollService.deleteDeduction(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "employee_deductions",
      record_id: Number(req.params.id),
      employee_id: oldValues?.employee_id,
      old_values: oldValues ? { type: oldValues.type, amount: oldValues.amount, employee_id: oldValues.employee_id } : null,
      description: oldValues ? `Deduction deleted: ${oldValues.type} ${oldValues.amount} for employee ${oldValues.employee_id}` : `Deduction ${req.params.id} deleted`,
    });
    res.json({ message: "Deleted" });
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({
        error: err.message,
        dependencies: err.dependencies,
        recommendation: err.recommendation,
      });
    }
    if (err.message === "Deduction not found") {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

// Mark One Paid
const getQueueStatus = async (req, res, next) => {
  try {
    const stats = await payrollService.getQueueStatus();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// Update markAsPaid (with branch access)
const markAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payrollId = Number(id);

    if (req.user.role !== ROLES.ADMIN) {
      const existing = await payrollService.getPayrollDetails(payrollId);
      const branchNum = existing?.branch_id ? Number(existing.branch_id) : null;
      if (!branchNum || !(await getUserBranchIds(req.user.id)).includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    // Fetch old state for audit before update
    const oldPayroll = await payrollService.getPayrollDetails(payrollId);

    // Update DB and queue email (async)
    const data = await payrollService.markAsPaid(payrollId, req.user.id);

    logger.info({ correlationId: req.correlationId, payroll_id: payrollId, rows_updated: data ? 1 : 0, employee_id: data?.employee_id ?? null, status: data?.status ?? null }, "[Payroll/Pay] markAsPaid result");

    if (!data) {
      logger.info({ correlationId: req.correlationId, payroll_id: payrollId }, "[Payroll/Pay] No payroll row matched id — lookup failed");
      return res.status(404).json({ message: "Payroll not found or not eligible for payment. Only UNPAID payroll can be marked as paid." });
    }

    // Get payroll details for notification
    const payroll = await payrollService.getPayrollDetails(payrollId);
    const dateRange = `${formatPayrollDate(payroll.cutoff_start)} to ${formatPayrollDate(payroll.cutoff_end)}`;

    // Notify HR about the payment
    notifyHR("Payroll Paid", `Payroll for ${dateRange} has been marked as paid.`, payrollId);

    // Audit log
    audit.auditLog(req, {
      action: "MARK_PAID",
      table_name: "payroll",
      record_id: payrollId,
      employee_id: payroll?.employee_id,
      branch_id: payroll?.branch_id,
      old_values: { status: oldPayroll?.status, paid_at: oldPayroll?.paid_at, paid_by: oldPayroll?.paid_by },
      new_values: { status: "PAID", paid_by: req.user.id, pay_date: payroll?.pay_date },
      description: `Payroll ${payrollId} marked as paid`,
    });

    // Return immediately (email is queued in background)
    res.json({
      message: "Payroll marked as paid. Payslip will be sent shortly.",
      data,
    });
  } catch (err) {
    next(err);
  }
};

// Update markAllAsPaid
const VALIDATION_ERRORS = [
  "Please generate payroll first.",
  "Payroll is already paid.",
  "Payroll is locked and cannot be marked as paid.",
  "Payroll is voided and cannot be marked as paid.",
];

const markAllAsPaid = async (req, res, next) => {
  try {
    const { cutoff_start, cutoff_end } = req.body;

    const data = await payrollService.markAllAsPaid(cutoff_start, cutoff_end, req.user.id);

    audit.auditLog(req, {
      action: "MARK_PAID",
      table_name: "payroll",
      old_values: { status: "UNPAID", cutoff_start, cutoff_end },
      new_values: { status: "PAID", paid_by: req.user.id, affected_count: data.count },
      description: `All payroll marked as paid: ${cutoff_start} to ${cutoff_end} (${data.count} records)`,
    });

    const dateRange = `${formatPayrollDate(cutoff_start)} to ${formatPayrollDate(cutoff_end)}`;
    notifyHR("Payroll Paid", `Payroll for ${dateRange} has been marked as paid.`, null);

    res.json({
      message: `All payroll marked as paid. ${data.emailsQueued} payslips queued for sending.`,
      data,
    });
  } catch (err) {
    if (VALIDATION_ERRORS.includes(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

// Delete Payroll by Cutoff
const deletePayrollByCutoff = async (req, res, next) => {
  try {
    const { cutoff_start, cutoff_end, pay_date } = req.body;

    const data = await payrollService.deletePayrollByCutoff(
      cutoff_start,
      cutoff_end,
      pay_date,
    );

    audit.auditLog(req, {
      action: "DELETE",
      table_name: "payroll",
      description: `Payroll deleted: ${cutoff_start} to ${cutoff_end}`,
    });

    res.json(data);
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({
        error: err.message,
        dependencies: err.dependencies,
        recommendation: err.recommendation,
      });
    }
    next(err);
  }
};

// Get My Payroll
const getMyPayroll = async (req, res, next) => {
  try {
    const { cutoff_start, cutoff_end } = req.query;
    const employee_id = req.user.employee_id;

    const data = await payrollService.getMyPayroll(
      employee_id,
      cutoff_start,
      cutoff_end,
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Get My Salary Details
const getMySalaryDetails = async (req, res, next) => {
  try {
    const employee_id = req.user.employee_id;
    const data = await payrollService.getMySalaryDetails(employee_id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Download Payslip (with branch access)
const downloadPayslip = async (req, res, next) => {
  try {
    const payrollId = Number(req.params.id);
    if (!Number.isInteger(payrollId) || payrollId <= 0) {
      return res.status(400).json({ message: "Invalid payroll ID." });
    }

    const payroll = await payrollService.getPayrollDetails(payrollId);
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found." });
    }

    if (req.user.role === ROLES.EMPLOYEE) {
      if (payroll.employee_id !== req.user.employee_id) {
        return res.status(403).json({ message: "You can only download your own payslip." });
      }
    } else if (req.user.role !== ROLES.ADMIN) {
      const assigned = await getUserBranchIds(req.user.id);
      const branchNum = payroll?.branch_id ? Number(payroll.branch_id) : null;
      if (!branchNum || !assigned.includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const companyService = require("../services/company.service");
    const company = await companyService.getCompany();
    const { generatePayslip } = require("../utils/payslipGenerator");

    audit.auditLog(req, {
      action: "EXPORT",
      table_name: "payroll",
      record_id: payrollId,
      employee_id: payroll?.employee_id,
      branch_id: payroll?.branch_id,
      description: `Payslip ${payrollId} downloaded by ${req.user.role} ${req.user.id}`,
    });

    generatePayslip(res, {
      ...payroll,
      company,
    });
  } catch (err) {
    next(err);
  }
};

const lockPayroll = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== ROLES.ADMIN) {
      const existing = await payrollService.getPayrollDetails(id);
      const branchNum = existing?.branch_id ? Number(existing.branch_id) : null;
      if (!branchNum || !(await getUserBranchIds(req.user.id)).includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const oldPayroll = await payrollService.getPayrollDetails(id);
    const data = await payrollService.lockPayroll(id, req.user.id);
    if (!data) return res.status(404).json({ message: "Payroll not found or not eligible for locking. Only UNPAID payroll can be locked." });
    audit.auditLog(req, { action: "UPDATE", table_name: "payroll", record_id: Number(id), employee_id: data?.employee_id, old_values: { status: oldPayroll?.status, locked_at: oldPayroll?.locked_at, locked_by: oldPayroll?.locked_by }, new_values: { status: "LOCKED", locked_by: req.user.id }, description: `Payroll ${id} locked` });
    const dateRange = `${formatPayrollDate(data.cutoff_start)} to ${formatPayrollDate(data.cutoff_end)}`;
    notifyHR("Payroll Locked", `Payroll for ${dateRange} has been locked.`, id);
    res.json({ message: "Payroll locked successfully", data });
  } catch (err) {
    next(err);
  }
};

const unlockPayroll = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== ROLES.ADMIN) {
      const existing = await payrollService.getPayrollDetails(id);
      const branchNum = existing?.branch_id ? Number(existing.branch_id) : null;
      if (!branchNum || !(await getUserBranchIds(req.user.id)).includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const oldPayroll = await payrollService.getPayrollDetails(id);
    const data = await payrollService.unlockPayroll(id);
    if (!data) return res.status(404).json({ message: "Payroll not found or not locked" });
    audit.auditLog(req, { action: "UPDATE", table_name: "payroll", record_id: Number(id), employee_id: data?.employee_id, old_values: { status: oldPayroll?.status }, new_values: { status: "UNPAID" }, description: `Payroll ${id} unlocked` });
    const dateRange = `${formatPayrollDate(data.cutoff_start)} to ${formatPayrollDate(data.cutoff_end)}`;
    notifyHR("Payroll Unlocked", `Payroll for ${dateRange} has been unlocked for modification.`, id);
    res.json({ message: "Payroll unlocked successfully", data });
  } catch (err) {
    next(err);
  }
};

const voidPayroll = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== ROLES.ADMIN) {
      const existing = await payrollService.getPayrollDetails(id);
      const branchNum = existing?.branch_id ? Number(existing.branch_id) : null;
      if (!branchNum || !(await getUserBranchIds(req.user.id)).includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const oldPayroll = await payrollService.getPayrollDetails(id);
    const data = await payrollService.voidPayroll(id, req.user.id);
    if (!data) return res.status(404).json({ message: "Payroll not found or not eligible for voiding. Only UNPAID or LOCKED payroll can be voided." });
    audit.auditLog(req, { action: "UPDATE", table_name: "payroll", record_id: Number(id), employee_id: data?.employee_id, old_values: { status: oldPayroll?.status, voided_at: oldPayroll?.voided_at, voided_by: oldPayroll?.voided_by }, new_values: { status: "VOID", voided_by: req.user.id }, description: `Payroll ${id} voided` });
    const dateRange = `${formatPayrollDate(data.cutoff_start)} to ${formatPayrollDate(data.cutoff_end)}`;
    notifyHR("Payroll Voided", `Payroll for ${dateRange} has been voided.`, id);
    res.json({ message: "Payroll voided successfully", data });
  } catch (err) {
    next(err);
  }
};

const getPayrollById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await payrollService.getPayrollDetails(id);

    if (req.user.role !== ROLES.ADMIN) {
      const assigned = await getUserBranchIds(req.user.id);
      const branchNum = data?.branch_id ? Number(data.branch_id) : null;
      if (!branchNum || !assigned.includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Get My Benefits
const getMyBenefits = async (req, res, next) => {
  try {
    const employee_id = req.user.employee_id;
    if (!employee_id) {
      return res.status(400).json({ message: "No linked employee record" });
    }
    const data = await payrollService.getMyBenefits(employee_id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBenefits,
  generatePayroll,
  getPayroll,
  getPayrollSummary,
  getEmployeeSalary,
  updateEmployeeSalary,
  getDeductions,
  createDeduction,
  updateDeduction,
  deleteDeduction,
  markAsPaid,
  markAllAsPaid,
  deletePayrollByCutoff,
  getMySalaryDetails,
  getMyPayroll,
  downloadPayslip,
  getPayrollById,
  getQueueStatus,
  lockPayroll,
  unlockPayroll,
  voidPayroll,
};
