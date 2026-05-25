const pool = require("../config/db");
const payrollService = require("../services/payroll.service");
const notificationService = require("../services/notification.service");
const audit = require("../services/audit.service");
const { getUserBranchIds } = require("../utils/branchAccess");

// Generate Payroll (with branch access)
const generatePayroll = async (req, res) => {
  try {
    const { cutoff_start, cutoff_end, pay_date } = req.body;
    const branch_id = req.body.branch_id || null;

    // HR_ADMIN must specify a branch (cannot generate for all branches)
    if (req.user.role !== "ADMIN" && !branch_id) {
      return res.status(403).json({ message: "You are not allowed to manage this branch." });
    }

    const data = await payrollService.generatePayroll(
      cutoff_start,
      cutoff_end,
      pay_date,
      branch_id,
    );

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
    if (req.user.role !== "ADMIN" && req.user.role !== "HR_ADMIN") {
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
    const data = await payrollService.updateEmployeeSalary(id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Deductions (with branch access)
const getDeductions = async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (req.user.role !== "ADMIN" && req.user.role !== "HR_ADMIN") {
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
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateDeduction = async (req, res) => {
  try {
    const data = await payrollService.updateDeduction(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteDeduction = async (req, res) => {
  try {
    await payrollService.deleteDeduction(req.params.id);
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

    // HR_ADMIN and ADMIN have unrestricted branch access
    if (req.user.role === "HR") {
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

    // Send in-app notification (fast)
    await notificationService.notify({
      user_id: payroll.employee_id,
      type: "PAYROLL",
      title: "Salary Released",
      message: `Your salary has been released`,
      reference_id: payrollId,
      meta: {
        payroll_id: payrollId,
        net_salary: payroll.net_salary,
        cutoff_start: payroll.cutoff_start,
        cutoff_end: payroll.cutoff_end,
      },
    });

    // Audit log
    audit.log({
      actor_id: req.user.id,
      action: "PAYROLL_PAID",
      entity_type: "payroll",
      entity_id: payrollId,
      req,
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

    audit.log({ actor_id: req.user.id, action: "PAYROLL_MARK_ALL_PAID", entity_type: "payroll", req });

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

    audit.log({ actor_id: req.user.id, action: "PAYROLL_DELETED", entity_type: "payroll", req });

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

    // Branch/ownership check
    if (req.user.role === "EMPLOYEE") {
      if (payroll.employee_id !== req.user.employee_id) {
        return res.status(403).json({ message: "You can only download your own payslip." });
      }
    } else if (req.user.role !== "ADMIN" && req.user.role !== "HR_ADMIN") {
      const assigned = await getUserBranchIds(req.user.id);
      const branchNum = payroll?.branch_id ? Number(payroll.branch_id) : null;
      if (!branchNum || !assigned.includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const companyService = require("../services/company.service");
    const company = await companyService.getCompany();
    const { generatePayslip } = require("../utils/payslipGenerator");

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

    if (req.user.role === "HR") {
      const existing = await payrollService.getPayrollDetails(id);
      const branchNum = existing?.branch_id ? Number(existing.branch_id) : null;
      if (!branchNum || !(await getUserBranchIds(req.user.id)).includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const data = await payrollService.lockPayroll(id);
    if (!data) return res.status(404).json({ message: "Payroll not found or already locked/paid" });
    audit.log({ actor_id: req.user.id, action: "PAYROLL_LOCKED", entity_type: "payroll", entity_id: Number(id), req });
    res.json({ message: "Payroll locked successfully", data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const unlockPayroll = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === "HR") {
      const existing = await payrollService.getPayrollDetails(id);
      const branchNum = existing?.branch_id ? Number(existing.branch_id) : null;
      if (!branchNum || !(await getUserBranchIds(req.user.id)).includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const data = await payrollService.unlockPayroll(id);
    if (!data) return res.status(404).json({ message: "Payroll not found or not locked" });
    audit.log({ actor_id: req.user.id, action: "PAYROLL_UNLOCKED", entity_type: "payroll", entity_id: Number(id), req });
    res.json({ message: "Payroll unlocked successfully", data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const voidPayroll = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === "HR") {
      const existing = await payrollService.getPayrollDetails(id);
      const branchNum = existing?.branch_id ? Number(existing.branch_id) : null;
      if (!branchNum || !(await getUserBranchIds(req.user.id)).includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const data = await payrollService.voidPayroll(id);
    if (!data) return res.status(404).json({ message: "Payroll not found or already paid/voided" });
    audit.log({ actor_id: req.user.id, action: "PAYROLL_VOIDED", entity_type: "payroll", entity_id: Number(id), req });
    res.json({ message: "Payroll voided successfully", data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await payrollService.getPayrollDetails(id);

    if (req.user.role !== "ADMIN" && req.user.role !== "HR_ADMIN") {
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

module.exports = {
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
