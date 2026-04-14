const dashboardService = require("../services/dashboard.service");

const getSummary = async (req, res) => {
  try {
    const data = await dashboardService.getSummary();
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
    const data = await dashboardService.getAdminAnalytics();
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

module.exports = {
  getSummary,
  getMySummary,
  getTodayStatus,
  getAdminAnalytics,
  getMyAnalytics,
};
