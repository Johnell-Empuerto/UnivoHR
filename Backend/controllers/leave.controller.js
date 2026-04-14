const leaveService = require("../services/leave.service");
// Remove notificationService import if not used elsewhere
// const notificationService = require("../services/notification.service");

// Helper function to format leave type display name
const getLeaveTypeDisplay = (type) => {
  const typeMap = {
    SICK: "Sick",
    ANNUAL: "Vacation",
    MATERNITY: "Maternity",
    EMERGENCY: "Emergency",
    NO_PAY: "Unpaid",
  };
  return typeMap[type] || type;
};

// CREATE LEAVE with credit validation and half-day support
const createLeave = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const employeeName =
      req.user.name || `${req.user.first_name} ${req.user.last_name}`;

    const {
      type,
      from_date,
      to_date,
      reason,
      day_fraction = 1,
      half_day_type = null,
    } = req.body;

    // Validation for half-day
    if (day_fraction === 0.5 && !half_day_type) {
      return res.status(400).json({
        message: "half_day_type is required for half-day leave",
        allowed: ["MORNING", "AFTERNOON"],
      });
    }

    if (day_fraction === 1 && half_day_type) {
      return res.status(400).json({
        message: "half_day_type should be null for full-day leave",
      });
    }

    if (
      half_day_type &&
      !["MORNING", "AFTERNOON"].includes(half_day_type.toUpperCase())
    ) {
      return res.status(400).json({
        message: "Invalid half_day_type. Must be 'MORNING' or 'AFTERNOON'",
        allowed: ["MORNING", "AFTERNOON"],
      });
    }

    if (day_fraction !== 1 && day_fraction !== 0.5) {
      return res.status(400).json({
        message: "Invalid day_fraction. Must be 1 (full day) or 0.5 (half day)",
      });
    }

    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);
    if (fromDate > toDate) {
      return res.status(400).json({
        message: "from_date cannot be after to_date",
      });
    }

    const creditCheck = await leaveService.checkAvailableCredits(
      employeeId,
      type,
      from_date,
      to_date,
      day_fraction,
    );

    if (!creditCheck.available) {
      return res.status(400).json({
        message: creditCheck.message,
        remaining: creditCheck.remaining,
      });
    }

    const leave = await leaveService.createLeave({
      type,
      from_date,
      to_date,
      reason,
      employee_id: employeeId,
      day_fraction,
      half_day_type: half_day_type ? half_day_type.toUpperCase() : null,
    });

    // Get approvers for notification
    const pool = require("../config/db");

    const adminUsers = await pool.query(
      `SELECT DISTINCT u.id 
       FROM users u
       WHERE u.role IN ('ADMIN', 'HR_ADMIN', 'HR')`,
    );

    const assignedApprovers = await pool.query(
      `SELECT ea.approver_id 
       FROM employee_approvers ea
       WHERE ea.employee_id = $1 AND ea.approval_type = 'LEAVE'`,
      [employeeId],
    );

    const approverIds = [
      ...adminUsers.rows.map((r) => r.id),
      ...assignedApprovers.rows.map((r) => r.approver_id),
    ];

    const uniqueApproverIds = [...new Set(approverIds)];
    const leaveTypeDisplay = getLeaveTypeDisplay(type);
    const durationText =
      day_fraction === 0.5
        ? `half-day ${half_day_type?.toLowerCase() || ""} leave`
        : "leave";

    //  Keep notification for APPROVERS here (this is correct)
    const notificationService = require("../services/notification.service");
    for (const approverId of uniqueApproverIds) {
      await notificationService.notify({
        user_id: approverId,
        type: "LEAVE",
        title: "New Leave Request",
        message: `${employeeName} requested ${leaveTypeDisplay} ${durationText}`,
        reference_id: leave.id,
        meta: {
          leave_id: leave.id,
          status: "PENDING",
          employee_name: employeeName,
          leave_type: leaveTypeDisplay,
          from_date,
          to_date,
          day_fraction,
          half_day_type: half_day_type ? half_day_type.toUpperCase() : null,
        },
      });
    }

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL (ADMIN)
const getLeaves = async (req, res) => {
  try {
    const data = await leaveService.getLeaves();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET MY LEAVES
const getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const data = await leaveService.getByEmployee(employeeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATED: REMOVED notification from controller - now handled in service
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { rejection_reason } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;
    const userEmployeeId = req.user.employee_id;
    const leaveId = req.params.id;

    console.log(`📝 Updating leave ${leaveId} to status: ${status}`);

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Validate rejection reason is required for REJECTED
    if (status === "REJECTED" && !rejection_reason) {
      return res.status(400).json({
        message: "Rejection reason is required when rejecting a leave request",
      });
    }

    const existing = await leaveService.getLeaveById(leaveId);

    if (!existing) {
      return res.status(404).json({ message: "Leave not found" });
    }

    //  PREVENT DUPLICATE: Check if already approved/rejected
    if (existing.status !== "PENDING") {
      console.log(
        ` Leave ${leaveId} already has status: ${existing.status}, skipping duplicate update`,
      );
      return res.status(400).json({
        message: `Leave request is already ${existing.status.toLowerCase()}. Cannot change status again.`,
        leave: existing,
      });
    }

    if (existing.employee_id === userEmployeeId) {
      return res.status(403).json({
        message: "You cannot approve your own leave",
      });
    }

    const owner = await leaveService.getEmployeeRole(existing.employee_id);

    const pool = require("../config/db");
    const isAssignedApprover = await pool.query(
      `SELECT 1 FROM employee_approvers 
       WHERE employee_id = $1 
       AND approver_id = $2 
       AND approval_type = 'LEAVE'
       LIMIT 1`,
      [existing.employee_id, userId],
    );

    const canApprove =
      (owner === "EMPLOYEE" &&
        ["HR", "HR_ADMIN", "ADMIN"].includes(userRole)) ||
      (owner === "HR" && ["HR_ADMIN", "ADMIN"].includes(userRole)) ||
      (owner === "HR_ADMIN" && userRole === "ADMIN") ||
      isAssignedApprover.rows.length > 0;

    if (!canApprove) {
      return res.status(403).json({
        message: "You are not allowed to approve this leave request",
      });
    }

    //  Notification is now handled INSIDE the service
    const result = await leaveService.updateStatus(
      leaveId,
      status,
      rejection_reason,
    );

    console.log(` Leave ${leaveId} updated to ${status}`);
    res.json(result);
  } catch (error) {
    console.error(" Error updating leave status:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createLeave,
  getLeaves,
  getMyLeaves,
  updateStatus,
};
