const leaveModel = require("../models/leave.model");
const attendanceModel = require("../models/attendance.model");
const leaveCreditModel = require("../models/leaveCredit.model");
const pool = require("../config/db");
const smtpService = require("./smtp.service");
const settingService = require("./setting.service");
const notificationService = require("./notification.service");
const emailTemplateService = require("./emailTemplate.service");

// Helper function to calculate days (UPDATED to support half-day)
const calculateDays = (from, to, dayFraction = 1) => {
  const start = new Date(from);
  const end = new Date(to);
  const fullDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return fullDays * dayFraction;
};

// Helper to format date
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper to get leave type display name
const getLeaveTypeDisplay = (type) => {
  const typeMap = {
    SICK: "Sick Leave",
    ANNUAL: "Vacation Leave",
    MATERNITY: "Maternity Leave",
    EMERGENCY: "Emergency Leave",
    NO_PAY: "Unpaid Leave",
  };
  return typeMap[type] || type;
};

// UPDATED: Send email notification using template system
const sendLeaveEmailNotification = async (
  leave,
  status,
  rejectionReason = null,
) => {
  try {
    const notifyKey =
      status === "APPROVED" ? "notify_leave_approved" : "notify_leave_rejected";
    const isEnabled = await settingService.getBoolSetting(notifyKey);

    if (!isEnabled) {
      console.log(`Email notification for leave ${status} is disabled`);
      return;
    }

    const employeeResult = await pool.query(
      `SELECT e.email, e.first_name, e.last_name 
       FROM employees e 
       WHERE e.id = $1`,
      [leave.employee_id],
    );

    const employee = employeeResult.rows[0];
    if (!employee || !employee.email) {
      console.log(`No email found for employee ${leave.employee_id}`);
      return;
    }

    const templateType =
      status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED";
    const data = {
      employee_name: `${employee.first_name} ${employee.last_name}`,
      leave_type: getLeaveTypeDisplay(leave.type),
      from_date: formatDate(leave.from_date),
      to_date: formatDate(leave.to_date),
      reason: leave.reason || "No reason provided",
      rejection_reason: rejectionReason || "",
    };

    // Use template system instead of hardcoded HTML
    const { subject, html } = await emailTemplateService.renderEmail(
      templateType,
      data,
    );

    await smtpService.sendEmail(employee.email, subject, html);
    console.log(
      `Leave ${status} email sent to ${employee.email} using template`,
    );
  } catch (error) {
    console.error(`Failed to send leave ${status} email:`, error.message);
  }
};

// GET LEAVE BY ID with formatted name
const getLeaveById = async (id) => {
  const leave = await leaveModel.getById(id);

  if (leave && !leave.employee_name) {
    const employeeResult = await pool.query(
      `SELECT first_name, last_name, middle_name, suffix, employee_code FROM employees WHERE id = $1`,
      [leave.employee_id],
    );
    const employee = employeeResult.rows[0];
    if (employee) {
      const firstName = employee.first_name || "";
      const middleName = employee.middle_name ? ` ${employee.middle_name}` : "";
      const lastName = employee.last_name ? ` ${employee.last_name}` : "";
      const suffix = employee.suffix ? `, ${employee.suffix}` : "";
      leave.employee_name =
        `${firstName}${middleName}${lastName}${suffix}`.trim();
      leave.employee_code = employee.employee_code || "";
    }
  }

  return leave;
};

const getEmployeeRole = async (employeeId) => {
  const result = await pool.query(
    `SELECT u.role FROM users u WHERE u.employee_id = $1`,
    [employeeId],
  );
  return result.rows[0]?.role;
};

// Check available credits with half-day support
const checkAvailableCredits = async (
  employeeId,
  type,
  fromDate,
  toDate,
  dayFraction = 1,
) => {
  let credits = await leaveCreditModel.getByEmployee(employeeId);

  if (!credits) {
    credits = await leaveCreditModel.createDefault(employeeId);
  }

  const days = calculateDays(fromDate, toDate, dayFraction);
  let remaining = 0;

  if (type === "SICK") {
    remaining = credits.sick_leave - credits.used_sick_leave;
  } else if (type === "ANNUAL") {
    remaining = credits.vacation_leave - credits.used_vacation_leave;
  } else if (type === "MATERNITY") {
    remaining = credits.maternity_leave - credits.used_maternity_leave;
  } else if (type === "EMERGENCY") {
    remaining = credits.emergency_leave - credits.used_emergency_leave;
  } else if (type === "NO_PAY") {
    return { available: true, remaining: Infinity };
  } else {
    throw new Error("Invalid leave type");
  }

  if (remaining < days) {
    return {
      available: false,
      message: `Insufficient ${type} leave credits. Available: ${remaining}, Requested: ${days}`,
      remaining,
    };
  }

  return { available: true, remaining };
};

// CREATE LEAVE
const createLeave = async (data) => {
  return await leaveModel.createLeave(data);
};

// GET ALL
const getLeaves = async () => {
  return await leaveModel.getLeaves();
};

// GET BY EMPLOYEE
const getByEmployee = async (employeeId) => {
  return await leaveModel.getByEmployee(employeeId);
};

// UPDATE STATUS with notification
const updateStatus = async (leaveId, status, rejectionReason = null) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await leaveModel.getById(leaveId, client);

    if (!existing) {
      throw new Error("Leave not found");
    }

    if (existing.status === "APPROVED" && status === "APPROVED") {
      await client.query("COMMIT");
      return existing;
    }

    const updated = await leaveModel.updateStatus(
      leaveId,
      status,
      rejectionReason,
      client,
    );

    if (status === "APPROVED" && existing.status !== "APPROVED") {
      await attendanceModel.markAsLeave(
        existing.employee_id,
        existing.from_date,
        existing.to_date,
        existing.day_fraction || 1,
        existing.half_day_type || null,
        client,
      );

      const days = calculateDays(
        existing.from_date,
        existing.to_date,
        existing.day_fraction || 1,
      );
      await leaveCreditModel.useLeave(
        existing.employee_id,
        existing.type,
        days,
        client,
      );
    }

    await client.query("COMMIT");

    const leaveTypeDisplay = getLeaveTypeDisplay(existing.type);
    const durationText =
      existing.day_fraction === 0.5
        ? `half-day ${existing.half_day_type?.toLowerCase() || ""} leave`
        : "leave";

    if (status === "APPROVED") {
      await notificationService.notify({
        user_id: existing.employee_id,
        type: "LEAVE",
        title: "Leave Approved",
        message: `Your ${leaveTypeDisplay} ${durationText} request has been approved`,
        reference_id: existing.id,
        meta: {
          leave_id: existing.id,
          status: "APPROVED",
          leave_type: leaveTypeDisplay,
          from_date: existing.from_date,
          to_date: existing.to_date,
          day_fraction: existing.day_fraction,
          half_day_type: existing.half_day_type,
        },
      });
      console.log(
        `📢 In-app notification sent to employee ${existing.employee_id}`,
      );

      await sendLeaveEmailNotification(existing, status, rejectionReason);
    } else if (status === "REJECTED") {
      await notificationService.notify({
        user_id: existing.employee_id,
        type: "LEAVE",
        title: "Leave Declined",
        message: `Your ${leaveTypeDisplay} ${durationText} request was not approved. Reason: ${rejectionReason}`,
        reference_id: existing.id,
        meta: {
          leave_id: existing.id,
          status: "REJECTED",
          leave_type: leaveTypeDisplay,
          from_date: existing.from_date,
          to_date: existing.to_date,
          day_fraction: existing.day_fraction,
          half_day_type: existing.half_day_type,
          rejection_reason: rejectionReason,
        },
      });
      console.log(
        `📢 In-app rejection notification sent to employee ${existing.employee_id}`,
      );

      await sendLeaveEmailNotification(existing, status, rejectionReason);
    }

    return updated;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createLeave,
  getLeaves,
  getByEmployee,
  updateStatus,
  checkAvailableCredits,
  calculateDays,
  getLeaveById,
  getEmployeeRole,
  sendLeaveEmailNotification,
};
