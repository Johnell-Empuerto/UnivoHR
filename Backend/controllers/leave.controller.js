const leaveService = require("../services/leave.service");
const audit = require("../services/audit.service");
const { ROLES } = require("../constants/roles");
const { cleanPlainText } = require("../utils/inputSanitizer");
const logger = require("../utils/logger");

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

// CREATE LEAVE with credit validation and half-day support - OPTIMIZED
const createLeave = async (req, res, next) => {
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
      reason: cleanPlainText(reason),
      employee_id: employeeId,
      day_fraction,
      half_day_type: half_day_type ? half_day_type.toUpperCase() : null,
    });

    // Get approvers for notification
    const pool = require("../config/db");

    // Run both queries in parallel for better performance
    const [adminUsers, assignedApprovers] = await Promise.all([
      pool.query(
        `SELECT DISTINCT u.id 
         FROM users u
         WHERE u.role = 'ADMIN' 
            OR EXISTS (SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_key = 'leave.approve' AND up.is_allowed = true)`,
      ),
      pool.query(
        `SELECT ea.approver_id 
         FROM employee_approvers ea
         WHERE ea.employee_id = $1 AND ea.approval_type = 'LEAVE'`,
        [employeeId],
      ),
    ]);

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

    // 🚀 OPTIMIZATION 1: Send notifications in PARALLEL (not sequential)
    const notificationService = require("../services/notification.service");

    const notificationPromises = uniqueApproverIds.map((approverId) =>
      notificationService.notify({
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
      }),
    );

    // 🚀 OPTIMIZATION 2: Don't wait for notifications (fire and forget)
    // This makes the response INSTANT for the user
    Promise.all(notificationPromises).catch((error) => {
      logger.error({ err: error, correlationId: req.correlationId }, "Failed to send some notifications");
    });

    // 🚀 OPTIMIZATION 3: Send response IMMEDIATELY (don't wait for notifications)
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "leaves",
      record_id: leave.id,
      employee_id: employeeId,
      new_values: {
        employee_id: employeeId,
        type,
        from_date,
        to_date,
        reason,
        day_fraction,
        half_day_type: half_day_type ? half_day_type.toUpperCase() : null,
        status: "PENDING",
      },
      description: `Leave request created: ${type} from ${from_date} to ${to_date}`,
    });

    res.status(201).json(leave);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "Create leave error");
    next(error);
  }
};

// GET ALL (ADMIN) with pagination
const getLeaves = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      type = "",
    } = req.query;

    const data = await leaveService.getLeaves(
      parseInt(page),
      parseInt(limit),
      search,
      status,
      type,
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// GET MY LEAVES with pagination
const getMyLeaves = async (req, res, next) => {
  try {
    const employeeId = req.user.employee_id;
    const { page = 1, limit = 10, status = "" } = req.query;

    const data = await leaveService.getByEmployee(
      employeeId,
      parseInt(page),
      parseInt(limit),
      status,
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// UPDATE STATUS - Already fast, but we can also optimize notifications here
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { rejection_reason } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;
    const userEmployeeId = req.user.employee_id;
    const leaveId = req.params.id;

    logger.info({ correlationId: req.correlationId }, `📝 Updating leave ${leaveId} to status: ${status}`);

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

    // PREVENT DUPLICATE: Check if already approved/rejected
    if (existing.status !== "PENDING") {
      logger.info({ correlationId: req.correlationId }, `Leave ${leaveId} already has status: ${existing.status}, skipping duplicate update`);
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
      isAssignedApprover.rows.length > 0 ||
      (owner === ROLES.EMPLOYEE && [ROLES.ADMIN].includes(userRole)) ||
      (owner === ROLES.EMPLOYEE && [ROLES.ADMIN].includes(userRole)) ||
      (owner === ROLES.ADMIN && userRole === ROLES.ADMIN);

    if (!canApprove) {
      return res.status(403).json({
        message: "You are not allowed to approve this leave request",
      });
    }

    // Notification is handled INSIDE the service (already fast - only 1 notification)
    const result = await leaveService.updateStatus(
      leaveId,
      status,
      cleanPlainText(rejection_reason),
    );

    audit.auditLog(req, {
      action: status === "APPROVED" ? "APPROVE" : "REJECT",
      table_name: "leaves",
      record_id: Number(leaveId),
      employee_id: existing.employee_id,
      old_values: { status: existing.status },
      new_values: { status, rejection_reason: rejection_reason || null },
      description: `Leave ${leaveId} ${status.toLowerCase()}${rejection_reason ? `: ${rejection_reason}` : ""}`,
    });

    logger.info({ correlationId: req.correlationId }, `Leave ${leaveId} updated to ${status}`);
    res.json(result);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "Error updating leave status");
    next(error);
  }
};

// CREATE LEAVE FOR EMPLOYEE — immediately approved on behalf of an employee (permission: leave.create_for_others)
const createLeaveForEmployee = async (req, res, next) => {
  try {
    const {
      employee_id,
      type,
      from_date,
      to_date,
      reason,
      day_fraction = 1,
      half_day_type = null,
    } = req.body;

    if (!employee_id) {
      return res.status(400).json({ message: "employee_id is required" });
    }

    // Verify target employee exists
    const pool = require("../config/db");
    const empResult = await pool.query(
      "SELECT id, first_name, last_name, employee_code FROM employees WHERE id = $1",
      [employee_id],
    );
    if (empResult.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Validate half-day
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

    // Reuse existing credit validation — checks the TARGET employee's credits
    const creditCheck = await leaveService.checkAvailableCredits(
      employee_id,
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

    // Create leave as PENDING for the target employee
    const leave = await leaveService.createLeave({
      type,
      from_date,
      to_date,
      reason: cleanPlainText(reason),
      employee_id,
      day_fraction,
      half_day_type: half_day_type ? half_day_type.toUpperCase() : null,
    });

    // Immediately approve using the existing approval service
    // This reuses ALL side effects:
    //   - status update (APPROVED)
    //   - attendance marking via attendanceModel.markAsLeave
    //   - leave credit deduction via leaveCreditModel.useLeave
    //   - in-app notification to employee (leave_approved rule)
    //   - email notification to employee
    await leaveService.updateStatus(leave.id, "APPROVED");

    // Fetch fully formatted result with employee name
    const result = await leaveService.getLeaveById(leave.id);

    // Audit log
    audit.auditLog(req, {
      action: "APPROVE",
      table_name: "leaves",
      record_id: result.id,
      employee_id,
      old_values: { status: "PENDING" },
      new_values: { status: "APPROVED", created_by_admin: req.user.id },
      description: `Leave created and approved on behalf of employee ${employee_id}: ${type} from ${from_date} to ${to_date}`,
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "Admin create leave error");
    next(error);
  }
};

module.exports = {
  createLeave,
  getLeaves,
  getMyLeaves,
  updateStatus,
  createLeaveForEmployee,
};
