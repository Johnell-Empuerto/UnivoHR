const reportService = require("../services/report.service");

const getEmployeeReport = async (req, res) => {
  try {
    const data = await reportService.getEmployeeReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLeaveReport = async (req, res) => {
  try {
    const data = await reportService.getLeaveReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const data = await reportService.getAttendanceReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPayrollReport = async (req, res) => {
  try {
    const data = await reportService.getPayrollReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBenefitsReport = async (req, res) => {
  try {
    const data = await reportService.getBenefitsReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPerformanceReport = async (req, res) => {
  try {
    const data = await reportService.getPerformanceReport(req.user, req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportReport = async (req, res) => {
  try {
    const result = await reportService.exportReport(req.user, req.query);
    if (result.csv) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.send(result.csv);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
