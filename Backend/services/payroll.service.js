const payrollModel = require("../models/payroll.model");
const queueService = require("./queue.service");
const notificationHelper = require("./notificationHelper.service");
const notificationDispatch = require("./notificationDispatch.service");
const pool = require("../config/db");
const logger = require("../utils/logger");

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

const generatePayroll = async (cutoff_start, cutoff_end, pay_date, branch_id) => {
  const result = await payrollModel.generatePayroll(cutoff_start, cutoff_end, pay_date, branch_id);

  if (result && !result.message) {
    const adminUsers = await pool.query(
      `SELECT id FROM users WHERE role = 'ADMIN'`
    );
    for (const admin of adminUsers.rows) {
      const notificationService = require("./notification.service");
      notificationService.notify({
        user_id: admin.id,
        type: "PAYROLL",
        title: "Payroll Generated",
        message: "Your payroll for the selected cutoff has been generated and is ready for review.",
        reference_id: null,
        meta: { cutoff_start, cutoff_end, branch_id },
      }).catch(err => logger.error({ err }, "[payroll] Notification error"));
    }
  }

  return result;
};

const getPayroll = async (cutoff_start, cutoff_end, page, limit, search, allowedBranchIds) => {
  return await payrollModel.getPayroll(
    cutoff_start,
    cutoff_end,
    page,
    limit,
    search,
    allowedBranchIds,
  );
};

const getPayrollSummary = async (cutoff_start, cutoff_end, allowedBranchIds) => {
  return await payrollModel.getPayrollSummary(cutoff_start, cutoff_end, allowedBranchIds);
};

const getEmployeeSalary = (page, limit, search, allowedBranchIds) =>
  payrollModel.getEmployeeSalary(page, limit, search, allowedBranchIds);

const updateEmployeeSalary = (id, data) =>
  payrollModel.updateEmployeeSalary(id, data);

const getDeductions = (employee_id) => payrollModel.getDeductions(employee_id);

const createDeduction = (data) => payrollModel.createDeduction(data);

const updateDeduction = (id, data) => payrollModel.updateDeduction(id, data);

const deleteDeduction = async (id) => {
  const deduction = await payrollModel.getDeductionById(id);
  if (!deduction) throw new Error("Deduction not found");

  const payrollCheck = await pool.query(
    `SELECT COUNT(*) AS cnt FROM payroll
     WHERE employee_id = $1 AND status IN ('PAID', 'LOCKED')`,
    [deduction.employee_id],
  );
  if (parseInt(payrollCheck.rows[0].cnt) > 0) {
    const err = new Error("Cannot delete deduction: this employee has finalized payroll records that include this deduction. Deactivate the deduction instead.");
    err.statusCode = 409;
    err.dependencies = [{ entity: "payroll", label: "finalized payroll records" }];
    err.recommendation = "Set the deduction as inactive instead of deleting it";
    throw err;
  }

  return await payrollModel.deleteDeduction(id);
};

// MARK AS PAID - OPTIMIZED (single query for employee)
const markAsPaid = async (id, userId = null) => {
  logger.info({ payroll_id: id, user_id: userId }, "[Payroll/Pay] UPDATE payroll SET status=PAID");

  const result = await pool.query(
    `
    UPDATE payroll 
    SET status = 'PAID', paid_at = NOW(), paid_by = $2
    WHERE id = $1 AND status = 'UNPAID'
    RETURNING *
    `,
    [id, userId],
  );

  logger.info({ payroll_id: id, row_count: result.rowCount }, "[Payroll/Pay] UPDATE result");

  const payroll = result.rows[0];
  if (payroll) {
    // Get employee details (single query)
    const employeeResult = await pool.query(
      `SELECT id, first_name, last_name, email, employee_code FROM employees WHERE id = $1`,
      [payroll.employee_id],
    );
    const employee = employeeResult.rows[0];

    if (employee && employee.email) {
      // Add to queue for background processing (respect email toggle)
      const emailAllowed = await notificationDispatch.canSendEmail("payroll_marked_paid");
      if (emailAllowed) {
        await queueService.addPayslipToQueue(payroll, employee);
      } else {
        logger.info("[payroll] Payslip email disabled for payroll_marked_paid, skipping queue");
      }
    }

    notificationDispatch.sendInAppIfEnabled("payroll_marked_paid", () =>
      notificationHelper.notifyEmployee(payroll.employee_id, {
        type: "PAYROLL",
        title: "Payroll Paid",
        message: "Your payroll for the selected cutoff has been marked as paid and is available for viewing.",
        reference_id: payroll.id,
        meta: { payroll_id: payroll.id, cutoff_start: payroll.cutoff_start, cutoff_end: payroll.cutoff_end },
      }),
    ).catch(err => logger.error({ err }, "[payroll] Employee notification error"));
  }

  return payroll;
};

// MARK ALL AS PAID - FULLY OPTIMIZED (NO N+1!)
const markAllAsPaid = async (cutoff_start, cutoff_end, userId = null) => {
  // Pre-check: determine state of payroll records for this cutoff
  const statusCheck = await pool.query(
    `SELECT status, COUNT(*)::int AS cnt
     FROM payroll
     WHERE cutoff_start::date = $1::date AND cutoff_end::date = $2::date
     GROUP BY status`,
    [cutoff_start, cutoff_end],
  );

  if (statusCheck.rows.length === 0) {
    throw new Error("Please generate payroll first.");
  }

  const statusMap = {};
  for (const row of statusCheck.rows) {
    statusMap[row.status] = row.cnt;
  }

  const hasUnpaid = statusMap['UNPAID'] > 0;
  const allPaid = !hasUnpaid && statusMap['PAID'] > 0 && !statusMap['LOCKED'] && !statusMap['VOID'];
  const allLocked = !hasUnpaid && statusMap['LOCKED'] > 0 && !statusMap['PAID'] && !statusMap['VOID'];
  const allVoid = !hasUnpaid && !statusMap['PAID'] && !statusMap['LOCKED'] && statusMap['VOID'] > 0;

  if (allPaid) {
    throw new Error("Payroll is already paid.");
  }
  if (allLocked) {
    throw new Error("Payroll is locked and cannot be marked as paid.");
  }
  if (allVoid) {
    throw new Error("Payroll is voided and cannot be marked as paid.");
  }

  // Update only UNPAID records
  const result = await pool.query(
    `
    UPDATE payroll
    SET status = 'PAID', paid_at = NOW(), paid_by = $3
    WHERE cutoff_start::date = $1::date
    AND cutoff_end::date = $2::date
    AND status = 'UNPAID'
    RETURNING *
    `,
    [cutoff_start, cutoff_end, userId],
  );

  // OPTIMIZATION: Batch fetch all employees in ONE query instead of N queries
  const employeeIds = result.rows.map((p) => p.employee_id);

  const employeeResult = await pool.query(
    `
    SELECT id, first_name, last_name, email, employee_code
    FROM employees
    WHERE id = ANY($1::int[])
    `,
    [employeeIds],
  );

  // Create employee map for O(1) lookup
  const employeeMap = new Map();
  for (const emp of employeeResult.rows) {
    employeeMap.set(emp.id, emp);
  }

  // Build payrolls with employees using the map (no DB queries!)
  const payrollsWithEmployees = [];
  for (const payroll of result.rows) {
    const employee = employeeMap.get(payroll.employee_id);
    if (employee && employee.email) {
      payrollsWithEmployees.push({
        payroll,
        employee,
      });
    }
  }

  // Add all to queue for background processing (respect email toggle)
  const emailAllowed = await notificationDispatch.canSendEmail("payroll_marked_paid");
  if (payrollsWithEmployees.length > 0 && emailAllowed) {
    await queueService.addBulkPayslipsToQueue(payrollsWithEmployees);
    logger.info(`[payroll] ${payrollsWithEmployees.length} payslip(s) queued`);
  } else if (payrollsWithEmployees.length > 0) {
    logger.info("[payroll] Bulk payslip email disabled for payroll_marked_paid, skipping queue");
  }

  for (const p of result.rows) {
    notificationDispatch.sendInAppIfEnabled("payroll_marked_paid", () =>
      notificationHelper.notifyEmployee(p.employee_id, {
        type: "PAYROLL",
        title: "Payroll Paid",
        message: "Your payroll for the selected cutoff has been marked as paid and is available for viewing.",
        reference_id: p.id,
        meta: { payroll_id: p.id, cutoff_start: p.cutoff_start, cutoff_end: p.cutoff_end },
      }),
    ).catch(err => logger.error({ err }, "[payroll] Bulk employee notification error"));
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

const deletePayrollByCutoff = async (cutoff_start, cutoff_end, pay_date) => {
  const versionCheck = await pool.query(
    `SELECT pv.id FROM payroll_versions pv
     JOIN payroll p ON p.id = pv.payroll_id
     WHERE p.cutoff_start::date = $1::date
       AND p.cutoff_end::date = $2::date
       AND p.pay_date::date = $3::date
       AND p.status NOT IN ('PAID', 'LOCKED', 'VOID')
     LIMIT 1`,
    [cutoff_start, cutoff_end, pay_date],
  );
  if (versionCheck.rows.length > 0) {
    const err = new Error("Cannot delete payroll: version snapshots exist. Void the payroll instead.");
    err.statusCode = 409;
    err.dependencies = [{ entity: "payroll_versions", label: "payroll version snapshots" }];
    err.recommendation = "Void the payroll instead of deleting it";
    throw err;
  }
  return await payrollModel.deletePayrollByCutoff(cutoff_start, cutoff_end, pay_date);
};

const getMyPayroll = async (employee_id, cutoff_start, cutoff_end) => {
  return await payrollModel.getMyPayroll(employee_id, cutoff_start, cutoff_end);
};

const getMySalaryDetails = async (employee_id) => {
  return await payrollModel.getMySalaryDetails(employee_id);
};

const getMyBenefits = async (employee_id) => {
  return await payrollModel.getMyBenefits(employee_id);
};

const getPayrollDetails = async (id) => {
  return await payrollModel.getPayrollDetails(id);
};

const lockPayroll = async (id, userId = null) => {
  return await payrollModel.lockPayroll(id, userId);
};

const unlockPayroll = async (id) => {
  return await payrollModel.unlockPayroll(id);
};

const voidPayroll = async (id, userId = null) => {
  return await payrollModel.voidPayroll(id, userId);
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
  getMyPayroll,
  getMySalaryDetails,
  getPayrollDetails,
  getEmployeesWithPayrollForCutoff,
  getQueueStatus,
  lockPayroll,
  unlockPayroll,
  voidPayroll,
};
