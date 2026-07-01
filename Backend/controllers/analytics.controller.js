const analyticsService = require("../services/analytics.service");
const logger = require("../utils/logger");

const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getCompanyOverview(req.user);
    res.json(data);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[AnalyticsController] overview error");
    next(error);
  }
};

const getAnomalyTrend = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await analyticsService.getAnomalyTrend(days);
    res.json(data);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[AnalyticsController] anomaly trend error");
    next(error);
  }
};

const getForecastSummary = async (req, res, next) => {
  try {
    const data = await analyticsService.getForecastSummary();
    res.json(data);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[AnalyticsController] forecast summary error");
    next(error);
  }
};

const getDepartmentComparison = async (req, res, next) => {
  try {
    let allowedBranchIds = null;
    if (req.user.role !== "ADMIN") {
      const { getUserBranchIds } = require("../utils/branchAccess");
      allowedBranchIds = await getUserBranchIds(req.user.id);
    }
    const data = await analyticsService.getDepartmentComparison(allowedBranchIds);
    res.json(data);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[AnalyticsController] department comparison error");
    next(error);
  }
};

module.exports = {
  getOverview,
  getAnomalyTrend,
  getForecastSummary,
  getDepartmentComparison,
};
