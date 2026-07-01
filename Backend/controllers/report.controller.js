const reportService = require("../services/report.service");

const getEmployeeReport = async (req, res, next) => {
  try {
    const data = await reportService.getEmployeeReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getLeaveReport = async (req, res, next) => {
  try {
    const data = await reportService.getLeaveReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getAttendanceReport = async (req, res, next) => {
  try {
    const data = await reportService.getAttendanceReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getPayrollReport = async (req, res, next) => {
  try {
    const data = await reportService.getPayrollReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getBenefitsReport = async (req, res, next) => {
  try {
    const data = await reportService.getBenefitsReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getPerformanceReport = async (req, res, next) => {
  try {
    const data = await reportService.getPerformanceReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const exportReport = async (req, res, next) => {
  try {
    const result = await reportService.exportReport(req.user, req.query);
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
  getEmployeeReport,
  getLeaveReport,
  getAttendanceReport,
  getPayrollReport,
  getBenefitsReport,
  getPerformanceReport,
  exportReport,
};
