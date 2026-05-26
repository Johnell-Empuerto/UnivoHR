const analyticsService = require("../services/analytics.service");

const getOverview = async (req, res) => {
  try {
    const data = await analyticsService.getCompanyOverview(req.user);
    res.json(data);
  } catch (error) {
    console.error("[AnalyticsController] overview error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getAnomalyTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await analyticsService.getAnomalyTrend(days);
    res.json(data);
  } catch (error) {
    console.error("[AnalyticsController] anomaly trend error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getForecastSummary = async (req, res) => {
  try {
    const data = await analyticsService.getForecastSummary();
    res.json(data);
  } catch (error) {
    console.error("[AnalyticsController] forecast summary error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getDepartmentComparison = async (req, res) => {
  try {
    let allowedBranchIds = null;
    if (req.user.role === "HR") {
      const { getUserBranchIds } = require("../utils/branchAccess");
      allowedBranchIds = await getUserBranchIds(req.user.id);
    }
    const data = await analyticsService.getDepartmentComparison(allowedBranchIds);
    res.json(data);
  } catch (error) {
    console.error("[AnalyticsController] department comparison error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOverview,
  getAnomalyTrend,
  getForecastSummary,
  getDepartmentComparison,
};
