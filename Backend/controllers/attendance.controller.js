const attendanceService = require("../services/attendance.service");
const rulesService = require("../services/attendance.service");
const attendanceModel = require("../models/attendance.model");
const settingService = require("../services/setting.service");
const audit = require("../services/audit.service");
const timezoneResolver = require("../utils/timezone");

// Create attendance (check-in / check-out logic)
const createAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.createAttendance(req.body);

    if (result.id) {
      audit.auditLog(req, {
        action:
          result.check_in_time && !result.check_out_time ? "INSERT" : "UPDATE",
        table_name: "attendance",
        record_id: result.id,
        employee_id: result.employee_id,
        new_values: {
          employee_id: result.employee_id,
          check_in_time: result.check_in_time,
          check_out_time: result.check_out_time,
          date: result.date,
          status: result.status,
          work_fraction: result.work_fraction,
        },
        description: `Attendance ${result.check_out_time ? "check-out" : "check-in"}: employee ${result.employee_id} on ${result.date}`,
      });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// Get all attendance
const getAttendance = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      date = "",
      branch_id = "",
    } = req.query;

    const data = await attendanceService.getAttendance(
      page,
      limit,
      search,
      status,
      date,
      branch_id,
      req.allowedBranchIds,
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Get attendance by employee
const getByEmployee = async (req, res, next) => {
  try {
    const { date = "" } = req.query;
    const data = await attendanceService.getByEmployee(req.params.id, date);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// GET RULES
const getRules = async (req, res, next) => {
  try {
    const data = await rulesService.getRules();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// UPDATE RULES
const updateRules = async (req, res, next) => {
  try {
    const oldRules = await rulesService.getRules();
    const data = await rulesService.updateRules(req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "attendance_rules",
      record_id: data.id,
      old_values: oldRules
        ? {
            late_threshold: oldRules.late_threshold,
            grace_period: oldRules.grace_period,
            max_work_hours: oldRules.max_work_hours,
            late_deduction_type: oldRules.late_deduction_type,
            late_deduction_value: oldRules.late_deduction_value,
            late_deduction_enabled: oldRules.late_deduction_enabled,
          }
        : null,
      new_values: {
        late_threshold: data.late_threshold,
        grace_period: data.grace_period,
        max_work_hours: data.max_work_hours,
        late_deduction_type: data.late_deduction_type,
        late_deduction_value: data.late_deduction_value,
        late_deduction_enabled: data.late_deduction_enabled,
      },
      description: "Attendance rules updated",
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET ALL RULES
const getAllRules = async (req, res, next) => {
  try {
    const data = await rulesService.getAllRules();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

//  CREATE
const createRule = async (req, res, next) => {
  try {
    const data = await rulesService.createRule(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "attendance_rules",
      record_id: data.id,
      new_values: {
        late_threshold: data.late_threshold,
        grace_period: data.grace_period,
        max_work_hours: data.max_work_hours,
        late_deduction_type: data.late_deduction_type,
        late_deduction_value: data.late_deduction_value,
        late_deduction_enabled: data.late_deduction_enabled,
        is_active: data.is_active,
      },
      description: "New attendance rule created",
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

//  ACTIVATE
const setActiveRule = async (req, res, next) => {
  try {
    const data = await rulesService.setActiveRule(req.params.id);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "attendance_rules",
      record_id: data.id,
      new_values: { is_active: data.is_active },
      description: `Attendance rule ${data.id} set as active`,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

//  DELETE
const deleteRule = async (req, res, next) => {
  try {
    const oldValues = await audit.fetchOldValues(
      "attendance_rules",
      req.params.id,
    );
    const data = await rulesService.deleteRule(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "attendance_rules",
      record_id: Number(req.params.id),
      old_values: oldValues
        ? {
            late_threshold: oldValues.late_threshold,
            grace_period: oldValues.grace_period,
            max_work_hours: oldValues.max_work_hours,
            is_active: oldValues.is_active,
          }
        : null,
      description: `Attendance rule ${req.params.id} deleted`,
    });
    res.json(data);
  } catch (err) {
    if (err.dependencies) err.details = { dependencies: err.dependencies };
    next(err);
  }
};

const updateRule = async (req, res, next) => {
  try {
    const oldValues = await audit.fetchOldValues(
      "attendance_rules",
      req.params.id,
    );
    const data = await rulesService.updateRule(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "attendance_rules",
      record_id: Number(req.params.id),
      old_values: oldValues
        ? {
            late_threshold: oldValues.late_threshold,
            grace_period: oldValues.grace_period,
            max_work_hours: oldValues.max_work_hours,
            late_deduction_type: oldValues.late_deduction_type,
            late_deduction_value: oldValues.late_deduction_value,
            late_deduction_enabled: oldValues.late_deduction_enabled,
            is_active: oldValues.is_active,
          }
        : null,
      new_values: {
        late_threshold: data.late_threshold,
        grace_period: data.grace_period,
        max_work_hours: data.max_work_hours,
        late_deduction_type: data.late_deduction_type,
        late_deduction_value: data.late_deduction_value,
        late_deduction_enabled: data.late_deduction_enabled,
        is_active: data.is_active,
      },
      description: `Attendance rule ${req.params.id} updated`,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// TIME MODIFICATION REQUESTS

// CREATE TIME MODIFICATION REQUEST
const createTimeModificationRequest = async (req, res, next) => {
  try {
    const employeeId = req.user.employee_id;
    const userId = req.user.id;
    const { attendance_id, requested_check_in, requested_check_out, reason } =
      req.body;

    // Validate required fields
    if (
      !attendance_id ||
      !requested_check_in ||
      !requested_check_out ||
      !reason
    ) {
      return res.status(400).json({
        message:
          "attendance_id, requested_check_in, requested_check_out, and reason are required",
      });
    }

    // Check if attendance record exists and belongs to employee
    const attendance = await attendanceModel.getAttendanceById(attendance_id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    if (attendance.employee_id !== employeeId) {
      return res.status(403).json({
        message:
          "You can only request modifications for your own attendance records",
      });
    }

    // Check for existing pending request
    const hasPending = await attendanceModel.hasPendingTimeRequest(
      employeeId,
      attendance_id,
    );
    if (hasPending) {
      return res.status(400).json({
        message:
          "You already have a pending time modification request for this attendance record",
      });
    }

    // Create the request
    const request = await attendanceModel.createTimeModificationRequest({
      employee_id: employeeId,
      attendance_id,
      requested_check_in,
      requested_check_out,
      reason,
    });

    audit.auditLog(req, {
      action: "INSERT",
      table_name: "time_modification_requests",
      record_id: request.id,
      employee_id: employeeId,
      new_values: {
        employee_id: employeeId,
        attendance_id,
        requested_check_in,
        requested_check_out,
        reason,
      },
      description: `Time modification request created for attendance ${attendance_id}`,
    });

    // Notify admins/HR
    const pool = require("../config/db");
    const adminUsers = await pool.query(
      `SELECT DISTINCT u.id
       FROM users u
       WHERE u.role = 'ADMIN' 
          OR EXISTS (SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_key = 'attendance.time_requests.approve' AND up.is_allowed = true)`,
    );

    const employeeResult = await pool.query(
      `SELECT first_name, last_name FROM employees WHERE id = $1`,
      [employeeId],
    );
    const employeeName = employeeResult.rows[0]
      ? `${employeeResult.rows[0].first_name} ${employeeResult.rows[0].last_name}`
      : "Employee";

    const notificationService = require("../services/notification.service");
    for (const admin of adminUsers.rows) {
      await notificationService.notify({
        user_id: admin.id,
        type: "TIME_MODIFICATION",
        title: "New Time Modification Request",
        message: `${employeeName} requested time modification for ${new Date(attendance.date).toLocaleDateString()}`,
        reference_id: request.id,
        meta: {
          request_id: request.id,
          status: "PENDING",
          employee_name: employeeName,
          attendance_date: attendance.date,
        },
      });
    }

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

// GET ALL TIME MODIFICATION REQUESTS (Admin/HR view)
const getTimeModificationRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const data = await attendanceModel.getTimeModificationRequests(page, limit);

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// GET MY TIME MODIFICATION REQUESTS
const getMyTimeModificationRequests = async (req, res, next) => {
  try {
    const employeeId = req.user.employee_id;
    const data =
      await attendanceModel.getMyTimeModificationRequests(employeeId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// UPDATE TIME MODIFICATION REQUEST STATUS (Approve/Reject)
const updateTimeModificationStatus = async (req, res, next) => {
  try {
    const { status, rejection_reason } = req.body;
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userEmployeeId = req.user.employee_id;

    // Validate status
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status. Must be APPROVED or REJECTED" });
    }

    // Rejection reason required for REJECTED status
    if (status === "REJECTED" && !rejection_reason) {
      return res.status(400).json({
        message:
          "Rejection reason is required when rejecting a time modification request",
      });
    }

    // Get the request
    const request = await attendanceModel.getTimeModificationRequestById(id);
    if (!request) {
      return res
        .status(404)
        .json({ message: "Time modification request not found" });
    }

    // Check if already processed
    if (request.status !== "PENDING") {
      return res.status(400).json({
        message: `Request is already ${request.status.toLowerCase()}. Cannot change status again.`,
        request,
      });
    }

    // Prevent self-approval
    if (request.employee_id === userEmployeeId) {
      return res.status(403).json({
        message: "You cannot approve/reject your own time modification request",
      });
    }

    // ADMIN can always approve
    // EMPLOYEE can approve only with attendance.time_requests.approve permission
    // user cannot approve own request (checked above)
    const pool = require("../config/db");
    const userIsAdmin = userRole === "ADMIN";
    const hasApprovePermission = await pool.query(
      `SELECT 1 FROM user_permissions WHERE user_id = $1 AND permission_key = 'attendance.time_requests.approve' AND is_allowed = true LIMIT 1`,
      [userId],
    );

    if (!userIsAdmin && hasApprovePermission.rows.length === 0) {
      return res.status(403).json({
        message:
          "You are not allowed to approve/reject this time modification request",
      });
    }

    // Update status
    const result = await attendanceModel.updateTimeModificationStatus(
      id,
      status,
      userId,
      rejection_reason,
    );

    audit.auditLog(req, {
      action: status === "APPROVED" ? "APPROVE" : "REJECT",
      table_name: "time_modification_requests",
      record_id: Number(id),
      employee_id: request.employee_id,
      new_values: {
        status,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejection_reason || null,
      },
      description: `Time modification request ${id} ${status.toLowerCase()}${rejection_reason ? `: ${rejection_reason}` : ""}`,
    });

    // If approved, apply changes to attendance
    if (status === "APPROVED") {
      await attendanceModel.applyTimeModification(
        request.attendance_id,
        request.requested_check_in,
        request.requested_check_out,
      );
    }

    // Notify employee
    const notificationHelper = require("../services/notificationHelper.service");
    await notificationHelper.notifyEmployee(request.employee_id, {
      type: "TIME_MODIFICATION",
      title: `Time Modification ${status.charAt(0) + status.slice(1).toLowerCase()}`,
      message: `Your time modification request for ${new Date(request.attendance_date).toLocaleDateString()} has been ${status.toLowerCase()}`,
      reference_id: request.id,
      meta: {
        request_id: request.id,
        status,
        rejection_reason: status === "REJECTED" ? rejection_reason : null,
      },
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// WEB CLOCK IN — employee self-service
const webClockIn = async (req, res, next) => {
  try {
    const isEnabled = await settingService.getBoolSetting(
      "enable_web_clock_in_out",
    );
    if (!isEnabled) {
      return res.status(403).json({
        message: "Web clock-in/out is currently disabled by administrator.",
      });
    }

    const employeeId = req.user.employee_id;
    const timezone = await timezoneResolver.resolveEmployeeTimezone(employeeId);
    const timestamp = new Date()
      .toLocaleString("sv-SE", { timeZone: timezone })
      .replace(" ", "T");

    const result = await attendanceService.webClockIn(employeeId, timestamp);

    audit.auditLog(req, {
      action: "INSERT",
      table_name: "attendance",
      record_id: result.id,
      employee_id: employeeId,
      new_values: {
        employee_id: employeeId,
        check_in_time: result.check_in_time,
        date: result.date,
        source: "WEB",
      },
      description: `Web clock-in: employee ${employeeId} at ${result.check_in_time}`,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// WEB CLOCK OUT — employee self-service
const webClockOut = async (req, res, next) => {
  try {
    const isEnabled = await settingService.getBoolSetting(
      "enable_web_clock_in_out",
    );
    if (!isEnabled) {
      return res.status(403).json({
        message: "Web clock-in/out is currently disabled by administrator.",
      });
    }

    const employeeId = req.user.employee_id;
    const timezone = await timezoneResolver.resolveEmployeeTimezone(employeeId);
    const timestamp = new Date()
      .toLocaleString("sv-SE", { timeZone: timezone })
      .replace(" ", "T");
    const existingRecord = await attendanceModel.getTodayRecord(
      employeeId,
      timestamp,
      timezone,
    );

    const result = await attendanceService.webClockOut(employeeId, timestamp);

    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "attendance",
      record_id: result.id,
      employee_id: employeeId,
      new_values: {
        employee_id: employeeId,
        check_out_time: result.check_out_time,
        date: result.date,
      },
      description: `Web clock-out: employee ${employeeId} at ${result.check_out_time}`,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAttendance,
  getAttendance,
  getByEmployee,
  getRules,
  updateRules,
  createRule,
  setActiveRule,
  deleteRule,
  getAllRules,
  updateRule,
  createTimeModificationRequest,
  getTimeModificationRequests,
  getMyTimeModificationRequests,
  updateTimeModificationStatus,
  webClockIn,
  webClockOut,
};
