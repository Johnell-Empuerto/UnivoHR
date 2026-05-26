const forecastService = require("../services/forecast.service");

const generateForecasts = async (req, res) => {
  try {
    const { branch_id } = req.body;
    const results = branch_id
      ? await forecastService.forecastByBranch()
      : await forecastService.runAllForecasts();
    res.json({ message: "Forecasts generated", results });
  } catch (error) {
    console.error("[ForecastController] generate error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const result = await forecastService.getForecastHistory(req.query);
    res.json(result);
  } catch (error) {
    console.error("[ForecastController] history error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getLatest = async (req, res) => {
  try {
    const result = await forecastService.getLatestForecasts(req.query);
    res.json(result);
  } catch (error) {
    console.error("[ForecastController] latest error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getAccuracy = async (req, res) => {
  try {
    const result = await forecastService.getForecastAccuracy(req.query);
    res.json(result);
  } catch (error) {
    console.error("[ForecastController] accuracy error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const updateActual = async (req, res) => {
  try {
    const { id } = req.params;
    const { actual_value } = req.body;
    if (actual_value === undefined || actual_value === null) {
      return res.status(400).json({ message: "actual_value is required" });
    }
    const updated = await forecastService.updateActualValue(id, actual_value);
    if (!updated) return res.status(404).json({ message: "Forecast not found" });
    res.json(updated);
  } catch (error) {
    console.error("[ForecastController] updateActual error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateForecasts,
  getHistory,
  getLatest,
  getAccuracy,
  updateActual,
};
