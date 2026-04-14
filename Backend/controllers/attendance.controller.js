const attendanceService = require("../services/attendance.service");
const rulesService = require("../services/attendance.service");
const attendanceModel = require("../models/attendance.model");

// Create attendance (check-in / check-out logic)
const createAttendance = async (req, res) => {
  try {
    console.log(" REQUEST BODY:", req.body);

    const result = await attendanceService.createAttendance(req.body);

    res.status(201).json(result);
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get all attendance
const getAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      date = "",
    } = req.query;

    const data = await attendanceService.getAttendance(
      page,
      limit,
      search,
      status,
      date,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by employee
const getByEmployee = async (req, res) => {
  try {
    const data = await attendanceService.getByEmployee(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET RULES
const getRules = async (req, res) => {
  try {
    const data = await rulesService.getRules();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE RULES
const updateRules = async (req, res) => {
  try {
    const data = await rulesService.updateRules(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL RULES
const getAllRules = async (req, res) => {
  try {
    const data = await rulesService.getAllRules();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  CREATE
const createRule = async (req, res) => {
  try {
    const data = await rulesService.createRule(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  ACTIVATE
const setActiveRule = async (req, res) => {
  try {
    const data = await rulesService.setActiveRule(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  DELETE
const deleteRule = async (req, res) => {
  try {
    const data = await rulesService.deleteRule(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRule = async (req, res) => {
  try {
    const data = await rulesService.updateRule(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// TIME MODIFICATION REQUESTS

// CREATE TIME MODIFICATION REQUEST
const createTimeModificationRequest = async (req, res) => {
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

    // Notify admins/HR
    const pool = require("../config/db");
    const adminUsers = await pool.query(
      `SELECT DISTINCT u.id
       FROM users u
       WHERE u.role IN ('ADMIN', 'HR_ADMIN', 'HR')`,
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
    res.status(500).json({ message: error.message });
  }
};

// GET ALL TIME MODIFICATION REQUESTS (Admin/HR view)
const getTimeModificationRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const data = await attendanceModel.getTimeModificationRequests(page, limit);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET MY TIME MODIFICATION REQUESTS
const getMyTimeModificationRequests = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const data =
      await attendanceModel.getMyTimeModificationRequests(employeeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE TIME MODIFICATION REQUEST STATUS (Approve/Reject)
const updateTimeModificationStatus = async (req, res) => {
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

    // Check permissions based on role hierarchy
    const pool = require("../config/db");
    const requestOwnerRole = await pool.query(
      `SELECT role FROM users WHERE employee_id = $1`,
      [request.employee_id],
    );
    const ownerRole = requestOwnerRole.rows[0]?.role || "EMPLOYEE";

    const canApprove =
      (ownerRole === "EMPLOYEE" &&
        ["HR", "HR_ADMIN", "ADMIN"].includes(userRole)) ||
      (ownerRole === "HR" && ["HR_ADMIN", "ADMIN"].includes(userRole)) ||
      (ownerRole === "HR_ADMIN" && userRole === "ADMIN");

    if (!canApprove) {
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

    // If approved, apply changes to attendance
    if (status === "APPROVED") {
      await attendanceModel.applyTimeModification(
        request.attendance_id,
        request.requested_check_in,
        request.requested_check_out,
      );
    }

    // Notify employee
    const notificationService = require("../services/notification.service");
    await notificationService.notify({
      user_id: request.employee_id,
      type: "TIME_MODIFICATION",
      title: `Time Modification ${status}`,
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
    res.status(500).json({ message: error.message });
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
};
