const statAnomalyService = require("../services/statisticalAnomaly.service");

const runDailyScan = async (req, res) => {
  try {
    const results = await statAnomalyService.runDailyStatisticalScan();
    res.json({ message: "Daily statistical anomaly scan completed", results });
  } catch (error) {
    console.error("[StatAnomalyController] daily scan error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const runWeeklyScan = async (req, res) => {
  try {
    const results = await statAnomalyService.runWeeklyStatisticalScan();
    res.json({ message: "Weekly statistical anomaly scan completed", results });
  } catch (error) {
    console.error("[StatAnomalyController] weekly scan error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  runDailyScan,
  runWeeklyScan,
};
