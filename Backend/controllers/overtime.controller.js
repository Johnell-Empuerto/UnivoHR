const overtimeService = require("../services/overtime.service");
const notificationService = require("../services/notification.service");

// Helper function to format date
const formatDateForMeta = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

// EMPLOYEE CONTROLLERS

const createOvertime = async (req, res) => {
  try {
    const employee_id = req.user.employee_id;
    const employeeName =
      req.user.name || `${req.user.first_name} ${req.user.last_name}`;

    const data = await overtimeService.createOvertime(employee_id, req.body);

    const pool = require("../config/db");

    const adminUsers = await pool.query(
      `SELECT DISTINCT u.id 
       FROM users u
       WHERE u.role IN ('ADMIN', 'HR_ADMIN', 'HR')`,
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
        message: `${employeeName} requested overtime`,
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

    res.json({ message: "Overtime request submitted successfully", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyOvertime = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// ADMIN/HR CONTROLLERS
// ==========================================

const getAllOvertime = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

const getOvertimeDetails = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

const approveOvertime = async (req, res) => {
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
    await notificationService.notify({
      user_id: overtimeRequest.employee_id,
      type: "OVERTIME",
      title: "Overtime Approved",
      message: `Your overtime request has been approved`,
      reference_id: id,
      meta: {
        overtime_id: id,
        status: "APPROVED",
        date: formatDateForMeta(overtimeRequest.date),
        hours: overtimeRequest.hours,
      },
    });

    res.json({ message: "Overtime request approved", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectOvertime = async (req, res) => {
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
    await notificationService.notify({
      user_id: overtimeRequest.employee_id,
      type: "OVERTIME",
      title: "Overtime Declined",
      message: `Your overtime request was not approved`,
      reference_id: id,
      meta: {
        overtime_id: id,
        status: "REJECTED",
        date: formatDateForMeta(overtimeRequest.date),
        hours: overtimeRequest.hours,
        reason: reason,
      },
    });

    res.json({ message: "Overtime request rejected", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// APPROVER MAPPINGS CONTROLLERS
// ==========================================

const getApprovers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", type = "" } = req.query;

    const data = await overtimeService.getApprovers(page, limit, search, type);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createApprover = async (req, res) => {
  try {
    const data = await overtimeService.createApprover(req.body);
    res.json({ message: "Approver mapping created", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateApprover = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await overtimeService.updateApprover(id, req.body);
    res.json({ message: "Approver mapping updated", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteApprover = async (req, res) => {
  try {
    const { id } = req.params;
    await overtimeService.deleteApprover(id);
    res.json({ message: "Approver mapping deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployeesForDropdown = async (req, res) => {
  try {
    const result = await overtimeService.getEmployeesForDropdown();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const isApprover = async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await overtimeService.isApprover(user_id);
    res.json({ isApprover: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOvertime,
  getMyOvertime,
  getAllOvertime,
  getOvertimeDetails,
  approveOvertime,
  rejectOvertime,
  getApprovers,
  createApprover,
  updateApprover,
  deleteApprover,
  getEmployeesForDropdown,
  isApprover,
};
