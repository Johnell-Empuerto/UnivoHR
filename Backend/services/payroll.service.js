const payrollModel = require("../models/payroll.model");
const queueService = require("./queue.service");
const pool = require("../config/db");

const getEmployeesWithPayrollForCutoff = async (cutoff_start, cutoff_end) => {
  const result = await pool.query(
    `
    SELECT 
      p.*,
      e.id as employee_id,
      e.first_name,
      e.last_name,
      e.email,
      e.employee_code
    FROM payroll p
    JOIN employees e ON e.id = p.employee_id
    WHERE p.cutoff_start::date = $1::date
    AND p.cutoff_end::date = $2::date
    AND p.status = 'PAID'
    `,
    [cutoff_start, cutoff_end],
  );
  return result.rows;
};

const generatePayroll = (cutoff_start, cutoff_end, pay_date) =>
  payrollModel.generatePayroll(cutoff_start, cutoff_end, pay_date);

const getPayroll = async (cutoff_start, cutoff_end, page, limit, search) => {
  return await payrollModel.getPayroll(
    cutoff_start,
    cutoff_end,
    page,
    limit,
    search,
  );
};

const getPayrollSummary = async (cutoff_start, cutoff_end) => {
  return await payrollModel.getPayrollSummary(cutoff_start, cutoff_end);
};

const getEmployeeSalary = (page, limit, search) =>
  payrollModel.getEmployeeSalary(page, limit, search);

const updateEmployeeSalary = (id, data) =>
  payrollModel.updateEmployeeSalary(id, data);

const getDeductions = (employee_id) => payrollModel.getDeductions(employee_id);

const createDeduction = (data) => payrollModel.createDeduction(data);

const updateDeduction = (id, data) => payrollModel.updateDeduction(id, data);

const deleteDeduction = (id) => payrollModel.deleteDeduction(id);

// MARK AS PAID - FIXED
const markAsPaid = async (id) => {
  const result = await pool.query(
    `
    UPDATE payroll 
    SET status = 'PAID' 
    WHERE id = $1 AND status != 'PAID' 
    RETURNING *
    `,
    [id],
  );

  const payroll = result.rows[0];
  if (payroll) {
    // Get employee details
    const employeeResult = await pool.query(
      `SELECT id, first_name, last_name, email, employee_code FROM employees WHERE id = $1`,
      [payroll.employee_id],
    );
    const employee = employeeResult.rows[0];

    if (employee && employee.email) {
      // Add to queue for background processing
      await queueService.addPayslipToQueue(payroll, employee);
    }
  }

  return payroll;
};

// MARK ALL AS PAID - FIXED
const markAllAsPaid = async (cutoff_start, cutoff_end) => {
  const result = await pool.query(
    `
    UPDATE payroll
    SET status = 'PAID'
    WHERE cutoff_start::date = $1::date
    AND cutoff_end::date = $2::date
    AND status != 'PAID'   
    RETURNING *
    `,
    [cutoff_start, cutoff_end],
  );

  if (result.rowCount === 0) {
    throw new Error("No payroll found for this cutoff");
  }

  // Get all employees with their payrolls
  const payrollsWithEmployees = [];
  for (const payroll of result.rows) {
    const employeeResult = await pool.query(
      `SELECT id, first_name, last_name, email, employee_code FROM employees WHERE id = $1`,
      [payroll.employee_id],
    );
    const employee = employeeResult.rows[0];
    if (employee && employee.email) {
      payrollsWithEmployees.push({
        payroll,
        employee,
      });
    }
  }

  // Add all to queue for background processing
  if (payrollsWithEmployees.length > 0) {
    await queueService.addBulkPayslipsToQueue(payrollsWithEmployees);
  }

  return {
    message: "All payroll marked as paid",
    count: result.rowCount,
    emailsQueued: payrollsWithEmployees.length,
  };
};

// Add queue stats endpoint helper
const getQueueStatus = async () => {
  return await queueService.getQueueStats();
};

const deletePayrollByCutoff = (cutoff_start, cutoff_end, pay_date) =>
  payrollModel.deletePayrollByCutoff(cutoff_start, cutoff_end, pay_date);

const getMyPayroll = async (employee_id, cutoff_start, cutoff_end) => {
  return await payrollModel.getMyPayroll(employee_id, cutoff_start, cutoff_end);
};

const getMySalaryDetails = async (employee_id) => {
  return await payrollModel.getMySalaryDetails(employee_id);
};

const getPayrollDetails = async (id) => {
  return await payrollModel.getPayrollDetails(id);
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
  getMyPayroll,
  getMySalaryDetails,
  getPayrollDetails,
  getEmployeesWithPayrollForCutoff,
  getQueueStatus,
};
