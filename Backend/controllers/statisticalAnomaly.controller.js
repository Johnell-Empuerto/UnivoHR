const statAnomalyService = require("../services/statisticalAnomaly.service");

const runDailyScan = async (req, res, next) => {
  try {
    const results = await statAnomalyService.runDailyStatisticalScan();
    res.json({ message: "Daily statistical anomaly scan completed", results });
  } catch (error) {
    next(error);
  }
};

const runWeeklyScan = async (req, res, next) => {
  try {
    const results = await statAnomalyService.runWeeklyStatisticalScan();
    res.json({ message: "Weekly statistical anomaly scan completed", results });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runDailyScan,
  runWeeklyScan,
};
