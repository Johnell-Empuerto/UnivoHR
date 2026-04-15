const manHourReportModel = require("../models/man_hour_report.model");
const notificationService = require("../services/notification.service");
const smtpService = require("./smtp.service");
const settingService = require("./setting.service");
const emailTemplateService = require("./emailTemplate.service");
const pool = require("../config/db");

// Helper function to format date
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Send email notification for man hour report approval/rejection
const sendManHourEmailNotification = async (
  report,
  status,
  rejectionReason = null,
) => {
  try {
    const notifyKey =
      status === "APPROVED"
        ? "notify_man_hour_approved"
        : "notify_man_hour_rejected";
    const isEnabled = await settingService.getBoolSetting(notifyKey);

    if (!isEnabled) {
      console.log(`Email notification for man hour ${status} is disabled`);
      return;
    }

    const employeeResult = await pool.query(
      `SELECT e.email, e.first_name, e.last_name
       FROM employees e
       WHERE e.id = $1`,
      [report.employee_id],
    );

    const employee = employeeResult.rows[0];
    if (!employee || !employee.email) {
      console.log(`No email found for employee ${report.employee_id}`);
      return;
    }

    const templateType =
      status === "APPROVED" ? "MAN_HOUR_APPROVED" : "MAN_HOUR_REJECTED";

    const data = {
      employee_name: `${employee.first_name} ${employee.last_name}`,
      work_date: formatDate(report.work_date),
      hours: report.hours ? report.hours.toString() : "0",
      task: report.task || "No task provided",
      rejection_reason: rejectionReason || "",
    };

    const { subject, html } = await emailTemplateService.renderEmail(
      templateType,
      data,
    );

    await smtpService.sendEmail(employee.email, subject, html);
    console.log(
      `Man hour ${status} email sent to ${employee.email} using template`,
    );
  } catch (error) {
    console.error(`Failed to send man hour ${status} email:`, error.message);
  }
};

// CREATE MAN HOUR REPORT
const createManHourReport = async (employee_id, data) => {
  // Check if using new format (with details)
  if (data.details && Array.isArray(data.details) && data.details.length > 0) {
    return await manHourReportModel.createManHourReportWithDetails({
      employee_id,
      work_date: data.work_date,
      details: data.details,
      remarks: data.remarks,
    });
  }

  // Legacy single-entry support (backward compatible)
  const exists = await manHourReportModel.existsForDate(
    employee_id,
    data.work_date,
  );

  if (exists) {
    throw new Error(
      "Man hour report already exists for this date. Please update instead.",
    );
  }

  // Convert single entry to details format
  const details = [
    {
      time_from: "09:00",
      time_to: `09:${data.hours * 60}`,
      activity: data.task,
    },
  ];

  return await manHourReportModel.createManHourReportWithDetails({
    employee_id,
    work_date: data.work_date,
    details,
    remarks: data.remarks,
  });
};

// GET MY MAN HOUR REPORTS
const getMyManHourReports = async (
  employee_id,
  page,
  limit,
  search,
  status,
) => {
  return await manHourReportModel.getMyManHourReports(
    employee_id,
    page,
    limit,
    search,
    status,
  );
};

// GET ALL MAN HOUR REPORTS (ADMIN/HR/APPROVERS)
const getAllManHourReports = async (
  user_id,
  page,
  limit,
  search,
  date,
  userRole,
) => {
  return await manHourReportModel.getAllManHourReports(
    user_id,
    page,
    limit,
    search,
    date,
    userRole,
  );
};

// GET MAN HOUR REPORT DETAILS
const getManHourReportDetails = async (id, user_id) => {
  let validUserId = user_id;
  if (validUserId === "" || validUserId === undefined || validUserId === null) {
    validUserId = null;
  } else {
    validUserId = Number(user_id);
    if (isNaN(validUserId)) validUserId = null;
  }
  return await manHourReportModel.getManHourReportDetails(id, validUserId);
};

// APPROVE MAN HOUR REPORT
const approveManHourReport = async (id, approver_id, comment, userRole) => {
  const report = await manHourReportModel.getManHourReportDetails(id);

  if (approver_id === report.employee_id) {
    throw new Error("You cannot approve your own man hour report");
  }

  let canApprove = false;
  if (userRole === "ADMIN" || userRole === "HR_ADMIN" || userRole === "HR") {
    canApprove = true;
  } else {
    canApprove = await manHourReportModel.canApprove(
      approver_id,
      report.employee_id,
      "MAN_HOUR",
      userRole,
    );
  }

  if (!canApprove) {
    throw new Error("You don't have permission to approve this report");
  }

  const result = await manHourReportModel.approveManHourReport(
    id,
    approver_id,
    comment,
  );

  // Send notification
  try {
    await notificationService.notify({
      user_id: report.employee_id,
      type: "MAN_HOUR",
      title: "Man Hour Report Approved",
      message: "Your man hour report has been approved",
      reference_id: id,
      meta: {
        man_hour_id: id,
        status: "APPROVED",
        work_date: report.work_date,
        hours: report.hours,
        task: report.task,
      },
    });

    await sendManHourEmailNotification(report, "APPROVED");
  } catch (emailError) {
    console.error("Notification/email failed:", emailError);
  }

  return result;
};

// REJECT MAN HOUR REPORT
const rejectManHourReport = async (id, approver_id, reason, userRole) => {
  const report = await manHourReportModel.getManHourReportDetails(id);

  if (approver_id === report.employee_id) {
    throw new Error("You cannot reject your own man hour report");
  }

  if (!reason) {
    throw new Error("Rejection reason is required");
  }

  let canApprove = false;
  if (userRole === "ADMIN" || userRole === "HR_ADMIN" || userRole === "HR") {
    canApprove = true;
  } else {
    canApprove = await manHourReportModel.canApprove(
      approver_id,
      report.employee_id,
      "MAN_HOUR",
      userRole,
    );
  }

  if (!canApprove) {
    throw new Error("You don't have permission to reject this report");
  }

  const result = await manHourReportModel.rejectManHourReport(
    id,
    approver_id,
    reason,
  );

  // Send notification
  try {
    await notificationService.notify({
      user_id: report.employee_id,
      type: "MAN_HOUR",
      title: "Man Hour Report Rejected",
      message: "Your man hour report was not approved",
      reference_id: id,
      meta: {
        man_hour_id: id,
        status: "REJECTED",
        work_date: report.work_date,
        hours: report.hours,
        task: report.task,
        rejection_reason: reason,
      },
    });

    await sendManHourEmailNotification(report, "REJECTED", reason);
  } catch (emailError) {
    console.error("Notification/email failed:", emailError);
  }

  return result;
};

// GET MAN HOUR SUMMARY
const getManHourSummary = async (start_date, end_date, employee_id = null) => {
  return await manHourReportModel.getManHourSummary(
    start_date,
    end_date,
    employee_id,
  );
};

// UPDATE MAN HOUR REPORT (only if not yet approved)
const updateManHourReport = async (id, employee_id, data) => {
  // Check if using new format (with details)
  if (data.details && Array.isArray(data.details) && data.details.length > 0) {
    return await manHourReportModel.updateManHourReportWithDetails(
      id,
      employee_id,
      data,
    );
  }

  // Legacy single-entry support
  const report = await manHourReportModel.getManHourReportDetails(id);

  if (report.employee_id !== employee_id) {
    throw new Error("You can only update your own man hour reports");
  }

  // Check if already approved
  if (report.status === "APPROVED") {
    throw new Error("Cannot update an approved man hour report");
  }

  // Convert single entry to details format
  const details = [
    {
      time_from: "09:00",
      time_to: `09:${data.hours * 60}`,
      activity: data.task,
    },
  ];

  return await manHourReportModel.updateManHourReportWithDetails(
    id,
    employee_id,
    {
      details,
      remarks: data.remarks,
    },
  );
};

// ADD NEW SERVICE FUNCTION
const getMissingManHourDates = async (employee_id, start_date, end_date) => {
  if (!start_date || !end_date) {
    throw new Error("start_date and end_date are required");
  }
  return await manHourReportModel.getMissingManHourDates(
    employee_id,
    start_date,
    end_date,
  );
};

// DELETE MAN HOUR REPORT (only if not yet approved)
const deleteManHourReport = async (id, employee_id, userRole) => {
  const report = await manHourReportModel.getManHourReportDetails(id);

  // Only admin/HR can delete any report, employee can only delete their own pending reports
  if (
    userRole !== "ADMIN" &&
    userRole !== "HR_ADMIN" &&
    userRole !== "HR" &&
    report.employee_id !== employee_id
  ) {
    throw new Error("You don't have permission to delete this report");
  }

  // Check if already approved
  if (report.status === "APPROVED") {
    throw new Error("Cannot delete an approved man hour report");
  }

  return await manHourReportModel.deleteManHourReport(id);
};

// Check if user is approver for man hour reports
const isApprover = async (user_id) => {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT 1 FROM employee_approvers
      WHERE approver_id = $1
      AND (approval_type = 'MAN_HOUR' OR approval_type = 'ALL')
      LIMIT 1
    ) as is_approver`,
    [user_id],
  );

  return result.rows[0].is_approver;
};

module.exports = {
  createManHourReport,
  getMyManHourReports,
  getAllManHourReports,
  getManHourReportDetails,
  approveManHourReport,
  rejectManHourReport,
  getManHourSummary,
  updateManHourReport,
  deleteManHourReport,
  isApprover,
  sendManHourEmailNotification,
  getMissingManHourDates,
};
