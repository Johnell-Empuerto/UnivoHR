const drilldownService = require("../services/drilldown.service");

const getAttendance = async (req, res, next) => {
  try {
    const result = await drilldownService.getDrillDownAttendance(req.user, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getPayroll = async (req, res, next) => {
  try {
    const result = await drilldownService.getDrillDownPayroll(req.user, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getOvertime = async (req, res, next) => {
  try {
    const result = await drilldownService.getDrillDownOvertime(req.user, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getLeaves = async (req, res, next) => {
  try {
    const result = await drilldownService.getDrillDownLeaves(req.user, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getAnomalies = async (req, res, next) => {
  try {
    const result = await drilldownService.getDrillDownAnomalies(req.user, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getBranches = async (req, res, next) => {
  try {
    const result = await drilldownService.getDrillDownBranch(req.user, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const exportDrillDown = async (req, res, next) => {
  try {
    const result = await drilldownService.exportDrillDown(req.user, req.query);
    if (result.csv) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.send(result.csv);
    }
    res.json(result);
  } catch (error) {
    next(error);
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
