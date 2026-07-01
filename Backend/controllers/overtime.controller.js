const overtimeService = require("../services/overtime.service");
const notificationService = require("../services/notification.service");
const audit = require("../services/audit.service");

// Helper function to format date
const formatDateForMeta = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

// EMPLOYEE CONTROLLERS

const createOvertime = async (req, res, next) => {
  try {
    const employee_id = req.user.employee_id;
    const employeeName =
      req.user.name || `${req.user.first_name} ${req.user.last_name}`;

    const data = await overtimeService.createOvertime(employee_id, req.body);

    const pool = require("../config/db");

    const adminUsers = await pool.query(
      `SELECT DISTINCT u.id 
       FROM users u
       WHERE u.role = 'ADMIN' OR EXISTS (
         SELECT 1 FROM user_permissions up
         WHERE up.user_id = u.id AND up.permission_key = 'approve.overtime' AND up.is_allowed = true
       )`,
    );

    const assignedApprovers = await pool.query(
      `SELECT ea.approver_id 
       FROM employee_approvers ea
       WHERE ea.employee_id = $1 AND ea.approval_type = 'OVERTIME'`,
      [employee_id],
    );

    const approverIds = [
      ...adminUsers.rows.map((r) => r.id),
      ...assignedApprovers.rows.map((r) => r.approver_id),
    ];

    const uniqueApproverIds = [...new Set(approverIds)];

    for (const approverId of uniqueApproverIds) {
      await notificationService.notify({
        user_id: approverId,
        type: "OVERTIME",
        title: "New Overtime Request",
        message: `${employeeName} requested ${req.body.hours}h overtime on ${req.body.date}`,
        reference_id: data.id,
        meta: {
          overtime_id: data.id,
          status: "PENDING",
          employee_name: employeeName,
          date: formatDateForMeta(req.body.date),
          hours: req.body.hours,
        },
      });
    }

    audit.auditLog(req, {
      action: "INSERT",
      table_name: "overtime_requests",
      record_id: data.id,
      employee_id,
      new_values: { employee_id, date: req.body.date, hours: req.body.hours, reason: req.body.reason, status: "PENDING" },
      description: `Overtime request created: ${req.body.hours}h on ${req.body.date}`,
    });

    res.json({ message: "Overtime request submitted successfully", data });
  } catch (error) {
    next(error);
  }
};

const getMyOvertime = async (req, res, next) => {
  try {
    const employee_id = req.user.employee_id;
    const { page = 1, limit = 10, search = "", status = "" } = req.query;

    const data = await overtimeService.getMyOvertime(
      employee_id,
      page,
      limit,
      search,
      status,
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN/HR CONTROLLERS
// ==========================================

const getAllOvertime = async (req, res, next) => {
  try {
    let user_id = req.user?.id;
    const userRole = req.user?.role;

    if (user_id === "" || user_id === undefined || user_id === null) {
      user_id = null;
    } else {
      user_id = Number(user_id);
      if (isNaN(user_id)) user_id = null;
    }

    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      date = "",
    } = req.query;

    const data = await overtimeService.getAllOvertime(
      user_id,
      page,
      limit,
      search,
      status,
      date,
      userRole,
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getOvertimeDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user_id = req.user?.id;

    if (user_id === "" || user_id === undefined || user_id === null) {
      user_id = null;
    } else {
      user_id = Number(user_id);
      if (isNaN(user_id)) user_id = null;
    }

    const data = await overtimeService.getOvertimeDetails(id, user_id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const approveOvertime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approver_id = req.user.id;
    const userRole = req.user.role;
    const { comment } = req.body;

    const data = await overtimeService.approveOvertime(
      id,
      approver_id,
      comment,
      userRole,
    );

    const overtimeRequest = await overtimeService.getOvertimeDetails(id);
    const notificationHelper = require("../services/notificationHelper.service");
    await notificationHelper.notifyEmployee(overtimeRequest.employee_id, {
      type: "OVERTIME",
      title: "Overtime Approved",
      message: `Your overtime request for ${overtimeRequest.date} (${overtimeRequest.hours}h) has been approved`,
      reference_id: id,
      meta: {
        overtime_id: id,
        status: "APPROVED",
        date: formatDateForMeta(overtimeRequest.date),
        hours: overtimeRequest.hours,
      },
    });

    audit.auditLog(req, {
      action: "APPROVE",
      table_name: "overtime_requests",
      record_id: Number(id),
      employee_id: overtimeRequest.employee_id,
      old_values: { status: "PENDING" },
      new_values: { status: "APPROVED", approved_by: approver_id, approved_at: new Date().toISOString() },
      description: `Overtime ${id} approved`,
    });

    res.json({ message: "Overtime request approved", data });
  } catch (error) {
    next(error);
  }
};

const rejectOvertime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approver_id = req.user.id;
    const userRole = req.user.role;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const data = await overtimeService.rejectOvertime(
      id,
      approver_id,
      reason,
      userRole,
    );

    const overtimeRequest = await overtimeService.getOvertimeDetails(id);
    const notificationHelper = require("../services/notificationHelper.service");
    await notificationHelper.notifyEmployee(overtimeRequest.employee_id, {
      type: "OVERTIME",
      title: "Overtime Declined",
      message: `Your overtime request for ${overtimeRequest.date} (${overtimeRequest.hours}h) was not approved. Reason: ${reason}`,
      reference_id: id,
      meta: {
        overtime_id: id,
        status: "REJECTED",
        date: formatDateForMeta(overtimeRequest.date),
        hours: overtimeRequest.hours,
        reason: reason,
      },
    });

    audit.auditLog(req, {
      action: "REJECT",
      table_name: "overtime_requests",
      record_id: Number(id),
      employee_id: overtimeRequest.employee_id,
      old_values: { status: "PENDING" },
      new_values: { status: "REJECTED", rejected_by: approver_id, rejected_at: new Date().toISOString(), rejected_reason: reason },
      description: `Overtime ${id} rejected: ${reason}`,
    });

    res.json({ message: "Overtime request rejected", data });
  } catch (error) {
    next(error);
  }
};

const deleteOvertime = async (req, res, next) => {
  try {
    await overtimeService.removeRequest(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "overtime_requests",
      record_id: Number(req.params.id),
      description: `Overtime request deleted: ${req.params.id}`,
    });
    res.json({ message: "Overtime request deleted successfully" });
  } catch (error) {
    if (error.code === "OVERTIME_IN_USE") {
      return res.status(409).json({
        message: error.message,
        dependencies: error.dependencies,
        recommendation: error.recommendation,
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// APPROVER MAPPINGS CONTROLLERS
// ==========================================

const getApprovers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", type = "" } = req.query;

    const data = await overtimeService.getApprovers(page, limit, search, type);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const createApprover = async (req, res, next) => {
  try {
    const data = await overtimeService.createApprover(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "employee_approvers",
      record_id: data.id,
      new_values: { employee_id: data.employee_id, approver_id: data.approver_id, approval_type: data.approval_type },
      description: `Approver mapping created: employee ${data.employee_id} → approver ${data.approver_id} (${data.approval_type})`,
    });
    res.json({ message: "Approver mapping created", data });
  } catch (error) {
    next(error);
  }
};

const updateApprover = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await overtimeService.updateApprover(id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "employee_approvers",
      record_id: Number(id),
      new_values: { employee_id: data.employee_id, approver_id: data.approver_id, approval_type: data.approval_type },
      description: `Approver mapping updated (id: ${id})`,
    });
    res.json({ message: "Approver mapping updated", data });
  } catch (error) {
    next(error);
  }
};

const deleteApprover = async (req, res, next) => {
  try {
    const { id } = req.params;
    await overtimeService.deleteApprover(id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "employee_approvers",
      record_id: Number(id),
      description: `Approver mapping deleted (id: ${id})`,
    });
    res.json({ message: "Approver mapping deleted" });
  } catch (error) {
    next(error);
  }
};

const getEmployeesForDropdown = async (req, res, next) => {
  try {
    const result = await overtimeService.getEmployeesForDropdown();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const isApprover = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const result = await overtimeService.isApprover(user_id);
    res.json({ isApprover: result });
  } catch (error) {
    next(error);
  }
};

const searchEmployeesPaginated = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "", status = "ACTIVE", hasUser } = req.query;
    const result = await overtimeService.searchEmployeesPaginated(
      Number(page), Number(limit), search, status, hasUser === "true",
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOvertime,
  getMyOvertime,
  getAllOvertime,
  getOvertimeDetails,
  approveOvertime,
  rejectOvertime,
  deleteOvertime,
  getApprovers,
  createApprover,
  updateApprover,
  deleteApprover,
  getEmployeesForDropdown,
  searchEmployeesPaginated,
  isApprover,
};
