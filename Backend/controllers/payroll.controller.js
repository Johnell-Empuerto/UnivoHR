const pool = require("../config/db");
const payrollService = require("../services/payroll.service");
const payrollModel = require("../models/payroll.model");
const notificationService = require("../services/notification.service");
const audit = require("../services/audit.service");
const { getUserBranchIds } = require("../utils/branchAccess");
const { normalizeRole, ROLES } = require("../constants/roles");

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
    Promise.all(promises).catch(err => console.error("[PAYROLL] HR notify error:", err));
  });
};

const notifyPayrollEmployees = (employeeIds, title, message) => {
  if (employeeIds.length === 0) return;
  payrollModel.getUserIdsByEmployeeIds(employeeIds).then(users => {
    if (users.length === 0) return;
    const promises = users.map(u =>
      notificationService.notify({ user_id: u.id, type: "PAYROLL", title, message, reference_id: null })
    );
    Promise.all(promises).catch(err => console.error("[PAYROLL] bulk notify error:", err));
  });
};

// Generate Payroll (with branch access)
const generatePayroll = async (req, res) => {
  try {
    const { cutoff_start, cutoff_end, pay_date } = req.body;
    const branch_id = req.body.branch_id || null;

    if (normalizeRole(req.user.role) !== ROLES.SYSTEM_ADMIN && !branch_id) {
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
    res.status(500).json({ message: error.message });
  }
};

// Get Payroll (with branch access)
const getPayroll = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

// Get Summary (with branch access)
const getPayrollSummary = async (req, res) => {
  try {
    const { cutoff_start, cutoff_end } = req.query;

    const data = await payrollService.getPayrollSummary(
      cutoff_start,
      cutoff_end,
      req.allowedBranchIds,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Employee Salary (with branch access)
const getEmployeeSalary = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    let allowedBranchIds = null;
    const role = normalizeRole(req.user.role);
    if (role !== ROLES.SYSTEM_ADMIN && role !== ROLES.ADMIN) {
      allowedBranchIds = await getUserBranchIds(req.user.id);
      if (allowedBranchIds.length === 0) {
        return res.status(403).json({ message: "You are not allowed to view this data." });
      }
    }

    const data = await payrollService.getEmployeeSalary(page, limit, search, allowedBranchIds);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateEmployeeSalary = async (req, res) => {
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
    res.status(500).json({ message: err.message });
  }
};

// Deductions (with branch access)
const getDeductions = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const role = normalizeRole(req.user.role);
    if (role !== ROLES.SYSTEM_ADMIN && role !== ROLES.ADMIN) {
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
    res.status(500).json({ message: err.message });
  }
};

const createDeduction = async (req, res) => {
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
    res.status(500).json({ message: err.message });
  }
};

const updateDeduction = async (req, res) => {
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
    res.status(500).json({ message: err.message });
  }
};

const deleteDeduction = async (req, res) => {
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
    res.status(500).json({ message: err.message });
  }
};

// Mark One Paid
const getQueueStatus = async (req, res) => {
  try {
    const stats = await payrollService.getQueueStatus();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update markAsPaid (with branch access)
const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const payrollId = Number(id);

    if (normalizeRole(req.user.role) === ROLES.HR_USER) {
      const existing = await payrollService.getPayrollDetails(payrollId);
      const branchNum = existing?.branch_id ? Number(existing.branch_id) : null;
      if (!branchNum || !(await getUserBranchIds(req.user.id)).includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    // Update DB and queue email (async)
    const data = await payrollService.markAsPaid(payrollId);

    console.log("[Payroll/Pay] markAsPaid result", {
      payroll_id: payrollId,
      rows_updated: data ? 1 : 0,
      employee_id: data?.employee_id ?? null,
      status: data?.status ?? null,
    });

    if (!data) {
      console.log("[Payroll/Pay] No payroll row matched id — lookup failed", {
        payroll_id: payrollId,
      });
      return res.status(404).json({ message: "Payroll not found" });
    }

    // Get payroll details for in-app notification
    const payroll = await payrollService.getPayrollDetails(payrollId);
    const dateRange = `${formatPayrollDate(payroll.cutoff_start)} to ${formatPayrollDate(payroll.cutoff_end)}`;

    // Send in-app notification to employee (fire-and-forget user_id lookup)
    payrollModel.getUserIdsByEmployeeIds([payroll.employee_id]).then(users => {
      if (users.length > 0) {
        notificationService.notify({
          user_id: users[0].id,
          type: "PAYROLL",
          title: "Payroll Paid",
          message: `Your salary for ${dateRange} has been marked as paid.`,
          reference_id: payrollId,
          meta: {
            payroll_id: payrollId,
            net_salary: payroll.net_salary,
            cutoff_start: payroll.cutoff_start,
            cutoff_end: payroll.cutoff_end,
          },
        }).catch(err => console.error("[PAYROLL] employee notify error:", err));
      }
    });

    // Notify HR about the payment
    notifyHR("Payroll Paid", `Payroll for ${dateRange} has been marked as paid.`, payrollId);

    // Audit log
    audit.auditLog(req, {
      action: "MARK_PAID",
      table_name: "payroll",
      record_id: payrollId,
      employee_id: payroll?.employee_id,
      branch_id: payroll?.branch_id,
      old_values: { status: "UNPAID" },
      new_values: { status: "PAID", pay_date: payroll?.pay_date },
      description: `Payroll ${payrollId} marked as paid`,
    });

    // Return immediately (email is queued in background)
    res.json({
      message: "Payroll marked as paid. Payslip will be sent shortly.",
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update markAllAsPaid
const VALIDATION_ERRORS = [
  "Please generate payroll first.",
  "Payroll is already paid.",
  "Payroll is locked and cannot be marked as paid.",
  "Payroll is voided and cannot be marked as paid.",
];

const markAllAsPaid = async (req, res) => {
  try {
    const { cutoff_start, cutoff_end } = req.body;

    const data = await payrollService.markAllAsPaid(cutoff_start, cutoff_end);

    audit.auditLog(req, {
      action: "MARK_PAID",
      table_name: "payroll",
      new_values: { status: "PAID", cutoff_start, cutoff_end },
      description: `All payroll marked as paid: ${cutoff_start} to ${cutoff_end} (${data.count} records)`,
    });

    const dateRange = `${formatPayrollDate(cutoff_start)} to ${formatPayrollDate(cutoff_end)}`;
    notifyHR("Payroll Paid", `Payroll for ${dateRange} has been marked as paid.`, null);
    payrollModel.getEmployeeIdsByCutoff(cutoff_start, cutoff_end).then(empIds => {
      notifyPayrollEmployees(empIds, "Payroll Paid", `Your salary for ${dateRange} has been marked as paid.`);
    });

    res.json({
      message: `All payroll marked as paid. ${data.emailsQueued} payslips queued for sending.`,
      data,
    });
  } catch (err) {
    const status = VALIDATION_ERRORS.includes(err.message) ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
};

// Delete Payroll by Cutoff
const deletePayrollByCutoff = async (req, res) => {
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
    res.status(500).json({ message: err.message });
  }
};

// Get My Payroll
const getMyPayroll = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

// Get My Salary Details
const getMySalaryDetails = async (req, res) => {
  try {
    const employee_id = req.user.employee_id;
    const data = await payrollService.getMySalaryDetails(employee_id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download Payslip (with branch access)
const downloadPayslip = async (req, res) => {
  try {
    const id = req.params.id;
    const payroll = await payrollService.getPayrollDetails(id);

    const dlRole = normalizeRole(req.user.role);
    if (dlRole === ROLES.EMPLOYEE) {
      if (payroll.employee_id !== req.user.employee_id) {
        return res.status(403).json({ message: "You can only download your own payslip." });
      }
    } else if (dlRole !== ROLES.SYSTEM_ADMIN && dlRole !== ROLES.ADMIN) {
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
      record_id: Number(id),
      employee_id: payroll?.employee_id,
      branch_id: payroll?.branch_id,
      description: `Payslip ${id} downloaded by ${req.user.role} ${req.user.id}`,
    });

    generatePayslip(res, {
      ...payroll,
      company,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const lockPayroll = async (req, res) => {
  try {
    const { id } = req.params;

    if (normalizeRole(req.user.role) === ROLES.HR_USER) {
      const existing = await payrollService.getPayrollDetails(id);
      const branchNum = existing?.branch_id ? Number(existing.branch_id) : null;
      if (!branchNum || !(await getUserBranchIds(req.user.id)).includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const data = await payrollService.lockPayroll(id);
    if (!data) return res.status(404).json({ message: "Payroll not found or already locked/paid" });
    audit.auditLog(req, { action: "UPDATE", table_name: "payroll", record_id: Number(id), employee_id: data?.employee_id, old_values: { status: "UNPAID" }, new_values: { status: "LOCKED" }, description: `Payroll ${id} locked` });
    const dateRange = `${formatPayrollDate(data.cutoff_start)} to ${formatPayrollDate(data.cutoff_end)}`;
    notifyHR("Payroll Locked", `Payroll for ${dateRange} has been locked.`, id);
    res.json({ message: "Payroll locked successfully", data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const unlockPayroll = async (req, res) => {
  try {
    const { id } = req.params;

    if (normalizeRole(req.user.role) === ROLES.HR_USER) {
      const existing = await payrollService.getPayrollDetails(id);
      const branchNum = existing?.branch_id ? Number(existing.branch_id) : null;
      if (!branchNum || !(await getUserBranchIds(req.user.id)).includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const data = await payrollService.unlockPayroll(id);
    if (!data) return res.status(404).json({ message: "Payroll not found or not locked" });
    audit.auditLog(req, { action: "UPDATE", table_name: "payroll", record_id: Number(id), employee_id: data?.employee_id, old_values: { status: "LOCKED" }, new_values: { status: "UNPAID" }, description: `Payroll ${id} unlocked` });
    const dateRange = `${formatPayrollDate(data.cutoff_start)} to ${formatPayrollDate(data.cutoff_end)}`;
    notifyHR("Payroll Unlocked", `Payroll for ${dateRange} has been unlocked for modification.`, id);
    res.json({ message: "Payroll unlocked successfully", data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const voidPayroll = async (req, res) => {
  try {
    const { id } = req.params;

    if (normalizeRole(req.user.role) === ROLES.HR_USER) {
      const existing = await payrollService.getPayrollDetails(id);
      const branchNum = existing?.branch_id ? Number(existing.branch_id) : null;
      if (!branchNum || !(await getUserBranchIds(req.user.id)).includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const data = await payrollService.voidPayroll(id);
    if (!data) return res.status(404).json({ message: "Payroll not found or already paid/voided" });
    audit.auditLog(req, { action: "UPDATE", table_name: "payroll", record_id: Number(id), employee_id: data?.employee_id, old_values: { status: data?.status === "LOCKED" ? "LOCKED" : "UNPAID" }, new_values: { status: "VOID" }, description: `Payroll ${id} voided` });
    const dateRange = `${formatPayrollDate(data.cutoff_start)} to ${formatPayrollDate(data.cutoff_end)}`;
    notifyHR("Payroll Voided", `Payroll for ${dateRange} has been voided.`, id);
    res.json({ message: "Payroll voided successfully", data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await payrollService.getPayrollDetails(id);

    const gpiRole = normalizeRole(req.user.role);
    if (gpiRole !== ROLES.SYSTEM_ADMIN && gpiRole !== ROLES.ADMIN) {
      const assigned = await getUserBranchIds(req.user.id);
      const branchNum = data?.branch_id ? Number(data.branch_id) : null;
      if (!branchNum || !assigned.includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get My Benefits
const getMyBenefits = async (req, res) => {
  try {
    const employee_id = req.user.employee_id;
    if (!employee_id) {
      return res.status(400).json({ message: "No linked employee record" });
    }
    const data = await payrollService.getMyBenefits(employee_id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
