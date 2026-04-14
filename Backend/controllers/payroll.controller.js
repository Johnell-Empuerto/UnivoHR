const payrollService = require("../services/payroll.service");
const notificationService = require("../services/notification.service");

// Generate Payroll
const generatePayroll = async (req, res) => {
  try {
    const { cutoff_start, cutoff_end, pay_date } = req.body;

    const data = await payrollService.generatePayroll(
      cutoff_start,
      cutoff_end,
      pay_date,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Payroll
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
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Summary
const getPayrollSummary = async (req, res) => {
  try {
    const { cutoff_start, cutoff_end } = req.query;

    const data = await payrollService.getPayrollSummary(
      cutoff_start,
      cutoff_end,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Employee Salary
const getEmployeeSalary = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const data = await payrollService.getEmployeeSalary(page, limit, search);

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

// Deductions
const getDeductions = async (req, res) => {
  try {
    const { employee_id } = req.params;
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

// Update markAsPaid - response is instant, emails in background
const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    // Update DB and queue email (async)
    const data = await payrollService.markAsPaid(id);

    // Get payroll details for in-app notification
    const payroll = await payrollService.getPayrollDetails(id);

    // Send in-app notification (fast)
    await notificationService.notify({
      user_id: payroll.employee_id,
      type: "PAYROLL",
      title: "Salary Released",
      message: `Your salary has been released`,
      reference_id: id,
      meta: {
        payroll_id: id,
        net_salary: payroll.net_salary,
        cutoff_start: payroll.cutoff_start,
        cutoff_end: payroll.cutoff_end,
      },
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
const markAllAsPaid = async (req, res) => {
  try {
    const { cutoff_start, cutoff_end } = req.body;

    const data = await payrollService.markAllAsPaid(cutoff_start, cutoff_end);

    // Return immediately (emails are queued in background)
    res.json({
      message: `All payroll marked as paid. ${data.emailsQueued} payslips queued for sending.`,
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

// Download Payslip
const downloadPayslip = async (req, res) => {
  try {
    const id = req.params.id;
    const payroll = await payrollService.getPayrollDetails(id);
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

const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await payrollService.getPayrollDetails(id);

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
};
