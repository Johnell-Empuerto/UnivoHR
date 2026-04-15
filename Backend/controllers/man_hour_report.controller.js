const manHourReportService = require("../services/man_hour_report.service");
const notificationService = require("../services/notification.service");
const pool = require("../config/db");

// Helper function to format date for meta
const formatDateForMeta = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

// ==========================================
// EMPLOYEE CONTROLLERS
// ==========================================
const createManHourReport = async (req, res) => {
  try {
    const employee_id = req.user.employee_id;
    const employeeName =
      req.user.name || `${req.user.first_name} ${req.user.last_name}`;

    const data = await manHourReportService.createManHourReport(
      employee_id,
      req.body,
    );

    // Notify approvers (same as before)
    const adminUsers = await pool.query(
      `SELECT DISTINCT u.id
       FROM users u
       WHERE u.role IN ('ADMIN', 'HR_ADMIN', 'HR')`,
    );

    const assignedApprovers = await pool.query(
      `SELECT ea.approver_id
       FROM employee_approvers ea
       WHERE ea.employee_id = $1 AND (ea.approval_type = 'MAN_HOUR' OR ea.approval_type = 'ALL')`,
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
        type: "MAN_HOUR",
        title: "New Man Hour Report",
        message: `${employeeName} submitted a man hour report with ${req.body.details?.length || 1} activities`,
        reference_id: data.id,
        meta: {
          man_hour_id: data.id,
          status: "SUBMITTED",
          employee_name: employeeName,
          work_date: formatDateForMeta(req.body.work_date),
          total_hours: data.hours,
          activities_count: req.body.details?.length || 1,
        },
      });
    }

    res.json({ message: "Man hour report submitted successfully", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyManHourReports = async (req, res) => {
  try {
    const employee_id = req.user.employee_id;
    const { page = 1, limit = 10, search = "", status = "" } = req.query;

    const data = await manHourReportService.getMyManHourReports(
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

const updateManHourReport = async (req, res) => {
  try {
    const { id } = req.params;
    const employee_id = req.user.employee_id;

    const data = await manHourReportService.updateManHourReport(
      id,
      employee_id,
      req.body,
    );

    res.json({ message: "Man hour report updated successfully", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteManHourReport = async (req, res) => {
  try {
    const { id } = req.params;
    const employee_id = req.user.employee_id;
    const userRole = req.user.role;

    await manHourReportService.deleteManHourReport(id, employee_id, userRole);

    res.json({ message: "Man hour report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// ADMIN/HR CONTROLLERS
// ==========================================

const getAllManHourReports = async (req, res) => {
  try {
    let user_id = req.user?.id;
    const userRole = req.user?.role;

    if (user_id === "" || user_id === undefined || user_id === null) {
      user_id = null;
    } else {
      user_id = Number(user_id);
      if (isNaN(user_id)) user_id = null;
    }

    const { page = 1, limit = 10, search = "", date = "" } = req.query;

    const data = await manHourReportService.getAllManHourReports(
      user_id,
      page,
      limit,
      search,
      date,
      userRole,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getManHourReportDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let user_id = req.user?.id;

    if (user_id === "" || user_id === undefined || user_id === null) {
      user_id = null;
    } else {
      user_id = Number(user_id);
      if (isNaN(user_id)) user_id = null;
    }

    const data = await manHourReportService.getManHourReportDetails(
      id,
      user_id,
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveManHourReport = async (req, res) => {
  try {
    const { id } = req.params;
    const approver_id = req.user.id;
    const userRole = req.user.role;
    const { comment } = req.body;

    const data = await manHourReportService.approveManHourReport(
      id,
      approver_id,
      comment,
      userRole,
    );

    const report = await manHourReportService.getManHourReportDetails(id);
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
      },
    });

    res.json({ message: "Man hour report approved", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectManHourReport = async (req, res) => {
  try {
    const { id } = req.params;
    const approver_id = req.user.id;
    const userRole = req.user.role;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const data = await manHourReportService.rejectManHourReport(
      id,
      approver_id,
      reason,
      userRole,
    );

    const report = await manHourReportService.getManHourReportDetails(id);
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
        reason: reason,
      },
    });

    res.json({ message: "Man hour report rejected", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// SUMMARY/REPORTING CONTROLLERS
// ==========================================

const getManHourSummary = async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ message: "start_date and end_date are required" });
    }

    const data = await manHourReportService.getManHourSummary(
      start_date,
      end_date,
      employee_id,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// APPROVER CHECK
// ==========================================

const isApprover = async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await manHourReportService.isApprover(user_id);
    res.json({ isApprover: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMissingManHourDates = async (req, res) => {
  try {
    const employee_id = req.user.employee_id;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        message: "start_date and end_date are required",
      });
    }

    const data = await manHourReportService.getMissingManHourDates(
      employee_id,
      start_date,
      end_date,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
  getMissingManHourDates,
};
