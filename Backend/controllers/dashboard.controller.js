const dashboardService = require("../services/dashboard.service");
const { getUserBranchIds } = require("../utils/branchAccess");

const getSummary = async (req, res) => {
  try {
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    let allowedBranchIds = null;
    if (req.user.role === "HR") {
      allowedBranchIds = await getUserBranchIds(req.user.id);
      if (allowedBranchIds.length === 0) {
        return res.status(403).json({ message: "You are not allowed to view this data." });
      }
    }

    const data = await dashboardService.getSummary(allowedBranchIds, startDate, endDate);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMySummary = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const data = await dashboardService.getMySummary(employeeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTodayStatus = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const data = await dashboardService.getTodayStatus(employeeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminAnalytics = async (req, res) => {
  try {
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    let allowedBranchIds = null;
    if (req.user.role === "HR") {
      allowedBranchIds = await getUserBranchIds(req.user.id);
      if (allowedBranchIds.length === 0) {
        return res.status(403).json({ message: "You are not allowed to view this data." });
      }
    }

    const data = await dashboardService.getAdminAnalytics(allowedBranchIds, startDate, endDate);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyAnalytics = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const data = await dashboardService.getMyAnalytics(employeeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExecutiveKpis = async (req, res) => {
  try {
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    let allowedBranchIds = null;
    if (req.user.role === "HR") {
      allowedBranchIds = await getUserBranchIds(req.user.id);
      if (allowedBranchIds.length === 0) {
        return res.status(403).json({ message: "You are not allowed to view this data." });
      }
    }

    const data = await dashboardService.getExecutiveKpis(allowedBranchIds, startDate, endDate);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSummary,
  getMySummary,
  getTodayStatus,
  getAdminAnalytics,
  getMyAnalytics,
  getExecutiveKpis,
};
