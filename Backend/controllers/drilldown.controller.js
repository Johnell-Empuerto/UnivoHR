const drilldownService = require("../services/drilldown.service");

const getAttendance = async (req, res) => {
  try {
    const result = await drilldownService.getDrillDownAttendance(req.user, req.query);
    res.json(result);
  } catch (error) {
    console.error("[DrilldownController] attendance error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getPayroll = async (req, res) => {
  try {
    const result = await drilldownService.getDrillDownPayroll(req.user, req.query);
    res.json(result);
  } catch (error) {
    console.error("[DrilldownController] payroll error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getOvertime = async (req, res) => {
  try {
    const result = await drilldownService.getDrillDownOvertime(req.user, req.query);
    res.json(result);
  } catch (error) {
    console.error("[DrilldownController] overtime error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getLeaves = async (req, res) => {
  try {
    const result = await drilldownService.getDrillDownLeaves(req.user, req.query);
    res.json(result);
  } catch (error) {
    console.error("[DrilldownController] leaves error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getAnomalies = async (req, res) => {
  try {
    const result = await drilldownService.getDrillDownAnomalies(req.user, req.query);
    res.json(result);
  } catch (error) {
    console.error("[DrilldownController] anomalies error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getBranches = async (req, res) => {
  try {
    const result = await drilldownService.getDrillDownBranch(req.user, req.query);
    res.json(result);
  } catch (error) {
    console.error("[DrilldownController] branches error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const exportDrillDown = async (req, res) => {
  try {
    const result = await drilldownService.exportDrillDown(req.user, req.query);
    if (result.csv) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.send(result.csv);
    }
    res.json(result);
  } catch (error) {
    console.error("[DrilldownController] export error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAttendance,
  getPayroll,
  getOvertime,
  getLeaves,
  getAnomalies,
  getBranches,
  exportDrillDown,
};
