const dashboardService = require("../services/dashboard.service");

const getSummary = async (req, res, next) => {
  try {
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    const data = await dashboardService.getSummary(req.allowedBranchIds, startDate, endDate);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getMySummary = async (req, res, next) => {
  try {
    const employeeId = req.user.employee_id;
    const data = await dashboardService.getMySummary(employeeId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getTodayStatus = async (req, res, next) => {
  try {
    const employeeId = req.user.employee_id;
    const data = await dashboardService.getTodayStatus(employeeId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getAdminAnalytics = async (req, res, next) => {
  try {
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    const data = await dashboardService.getAdminAnalytics(req.allowedBranchIds, startDate, endDate);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getMyAnalytics = async (req, res, next) => {
  try {
    const employeeId = req.user.employee_id;
    const data = await dashboardService.getMyAnalytics(employeeId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getExecutiveKpis = async (req, res, next) => {
  try {
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    const data = await dashboardService.getExecutiveKpis(req.allowedBranchIds, startDate, endDate);
    res.json(data);
  } catch (error) {
    next(error);
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
