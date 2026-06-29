const overtimeModel = require("../models/overtime.model");
const smtpService = require("./smtp.service");
const notificationHelper = require("./notificationHelper.service");
const notificationDispatch = require("./notificationDispatch.service");
const pool = require("../config/db");
const emailTemplateService = require("./emailTemplate.service");
const { cleanPlainText } = require("../utils/inputSanitizer");

// Helper function to format date
const formatDate = (dateStr) => {
  console.log("Formatting date:", dateStr);
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    console.log("Formatted date:", formatted);
    return formatted;
  } catch (error) {
    console.error("Date formatting error:", error);
    return "N/A";
  }
};

// Helper function to format time
const formatTime = (timeStr) => {
  if (!timeStr) return "N/A";
  return timeStr.substring(0, 5);
};

// UPDATED: Send email notification using template system
const sendOvertimeEmailNotification = async (
  overtime,
  status,
  rejectionReason = null,
) => {
  try {
    const ruleKey =
      status === "APPROVED"
        ? "overtime_approved"
        : "overtime_rejected";
    const allowed = await notificationDispatch.canSendEmail(ruleKey);

    if (!allowed) {
      console.log(`Email notification for ${ruleKey} is disabled`);
      return;
    }

    const employeeResult = await pool.query(
      `SELECT e.email, e.first_name, e.last_name 
       FROM employees e 
       WHERE e.id = $1`,
      [overtime.employee_id],
    );

    const employee = employeeResult.rows[0];
    if (!employee || !employee.email) {
      console.log(`No email found for employee ${overtime.employee_id}`);
      return;
    }

    const templateType =
      status === "APPROVED" ? "OVERTIME_APPROVED" : "OVERTIME_REJECTED";

    // FIXED: Make sure date is properly formatted
    const formattedDate = overtime.date ? formatDate(overtime.date) : "N/A";
    const formattedHours = overtime.hours ? overtime.hours.toString() : "0";

    const data = {
      employee_name: `${employee.first_name} ${employee.last_name}`,
      date: formattedDate, // Make sure this is being passed
      hours: formattedHours,
      reason: overtime.reason || "No reason provided",
      rejection_reason: rejectionReason || "",
    };

    console.log("Overtime email data:", data); // Debug log

    const { subject, html } = await emailTemplateService.renderEmail(
      templateType,
      data,
    );

    await smtpService.sendEmail(employee.email, subject, html);
    console.log(
      `Overtime ${status} email sent to ${employee.email} using template`,
    );
  } catch (error) {
    console.error(`Failed to send overtime ${status} email:`, error.message);
  }
};

const createOvertime = async (employee_id, data) => {
  const sanitized = { ...data };
  if (sanitized.reason) sanitized.reason = cleanPlainText(sanitized.reason);
  return await overtimeModel.createOvertime({ employee_id, ...sanitized });
};

const getMyOvertime = async (employee_id, page, limit, search, status) => {
  return await overtimeModel.getMyOvertime(
    employee_id,
    page,
    limit,
    search,
    status,
  );
};

const getAllOvertime = async (
  user_id,
  page,
  limit,
  search,
  status,
  date,
  userRole,
) => {
  let validUserId = user_id;
  if (validUserId === "" || validUserId === undefined || validUserId === null) {
    validUserId = null;
  } else {
    validUserId = Number(validUserId);
    if (isNaN(validUserId)) validUserId = null;
  }

  return await overtimeModel.getAllOvertime(
    validUserId,
    page,
    limit,
    search,
    status,
    date,
    userRole,
  );
};

const getOvertimeDetails = async (id, user_id) => {
  let validUserId = user_id;
  if (validUserId === "" || validUserId === undefined || validUserId === null) {
    validUserId = null;
  } else {
    validUserId = Number(validUserId);
    if (isNaN(validUserId)) validUserId = null;
  }
  return await overtimeModel.getOvertimeDetails(id, validUserId);
};

const approveOvertime = async (id, approver_id, comment, userRole) => {
  const request = await overtimeModel.getOvertimeDetails(id);

  if (approver_id === request.employee_id) {
    throw new Error("You cannot approve your own overtime request");
  }

  if (request.is_paid) {
    throw new Error("Cannot approve already paid overtime request");
  }

  let canApprove = false;
  if (userRole === "ADMIN") {
    canApprove = true;
  } else {
    canApprove = await overtimeModel.canApprove(
      approver_id,
      request.employee_id,
      "OVERTIME",
      userRole,
    );
  }

  if (!canApprove) {
    throw new Error("You don't have permission to approve this request");
  }

  const result = await overtimeModel.approveOvertime(id, approver_id, comment ? cleanPlainText(comment) : comment);

  try {
    await sendOvertimeEmailNotification(request, "APPROVED");
  } catch (emailError) {
    console.error("Email notification failed:", emailError);
  }

  notificationDispatch.sendInAppIfEnabled("overtime_approved", () =>
    notificationHelper.notifyEmployee(request.employee_id, {
      type: "OVERTIME",
      title: "Overtime Approved",
      message: "Your overtime request has been approved.",
      reference_id: id,
      meta: { overtime_id: id, status: "APPROVED" },
    }),
  ).catch(err => console.error("[overtime] In-app notification error:", err.message));

  return result;
};

const rejectOvertime = async (id, approver_id, reason, userRole) => {
  const request = await overtimeModel.getOvertimeBasic(id);

  if (approver_id === request.employee_id) {
    throw new Error("You cannot reject your own overtime request");
  }

  if (request.is_paid) {
    throw new Error("Cannot reject already paid overtime request");
  }

  let canApprove = false;
  if (userRole === "ADMIN") {
    canApprove = true;
  } else {
    canApprove = await overtimeModel.canApprove(
      approver_id,
      request.employee_id,
      "OVERTIME",
      userRole,
    );
  }

  if (!canApprove) {
    throw new Error("You don't have permission to reject this request");
  }

  const result = await overtimeModel.rejectOvertime(id, approver_id, reason ? cleanPlainText(reason) : reason);

  try {
    await sendOvertimeEmailNotification(request, "REJECTED", reason);
  } catch (emailError) {
    console.error("Email notification failed:", emailError);
  }

  notificationDispatch.sendInAppIfEnabled("overtime_rejected", () =>
    notificationHelper.notifyEmployee(request.employee_id, {
      type: "OVERTIME",
      title: "Overtime Rejected",
      message: "Your overtime request has been rejected.",
      reference_id: id,
      meta: { overtime_id: id, status: "REJECTED", rejection_reason: reason },
    }),
  ).catch(err => console.error("[overtime] In-app notification error:", err.message));

  return result;
};

const removeRequest = async (id) => {
  const request = await overtimeModel.getOvertimeBasic(id);
  if (!request) throw new Error("Overtime request not found");
  if (request.status === "APPROVED") {
    const error = new Error("Cannot delete an approved overtime request.");
    error.code = "OVERTIME_IN_USE";
    error.statusCode = 409;
    error.dependencies = { payroll: request.is_paid ? 1 : 0 };
    error.recommendation = "Leave the record as is.";
    throw error;
  }
  await overtimeModel.deleteOvertimeRequest(id);
};

const getOvertimeHoursForPayroll = async (
  employee_id,
  start_date,
  end_date,
) => {
  return await overtimeModel.getOvertimeHoursForPayroll(
    employee_id,
    start_date,
    end_date,
  );
};

const markOvertimeAsPaid = async (
  employee_id,
  start_date,
  end_date,
  payroll_id,
) => {
  return await overtimeModel.markOvertimeAsPaid(
    employee_id,
    start_date,
    end_date,
    payroll_id,
  );
};

const getOvertimeSummaryForPayroll = async (start_date, end_date) => {
  return await overtimeModel.getOvertimeSummaryForPayroll(start_date, end_date);
};

const getApprovers = async (page, limit, search, type) => {
  return await overtimeModel.getApprovers(page, limit, search, type);
};

const createApprover = async (data) => {
  return await overtimeModel.createApprover(data);
};

const updateApprover = async (id, data) => {
  return await overtimeModel.updateApprover(id, data);
};

const deleteApprover = async (id) => {
  return await overtimeModel.deleteApprover(id);
};

const getEmployeesForDropdown = async () => {
  return await overtimeModel.getEmployeesForDropdown();
};

const searchEmployeesPaginated = async (page, limit, search, status, hasUser) => {
  return await overtimeModel.searchEmployeesPaginated(page, limit, search, status, hasUser);
};

const isApprover = async (user_id) => {
  return await overtimeModel.isApprover(user_id);
};

module.exports = {
  createOvertime,
  getMyOvertime,
  getAllOvertime,
  getOvertimeDetails,
  approveOvertime,
  rejectOvertime,
  removeRequest,
  getOvertimeHoursForPayroll,
  markOvertimeAsPaid,
  getOvertimeSummaryForPayroll,
  getApprovers,
  createApprover,
  updateApprover,
  deleteApprover,
  getEmployeesForDropdown,
  searchEmployeesPaginated,
  isApprover,
  sendOvertimeEmailNotification,
};
