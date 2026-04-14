const service = require("../services/historyLeave.service");

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", year } = req.query;
    const data = await service.getAll(page, limit, search, year);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSummary = async (req, res) => {
  try {
    const data = await service.getSummary();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getYearlySummary = async (req, res) => {
  try {
    const data = await service.getYearlySummary();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEmployeeSummary = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const data = await service.getEmployeeSummary(employee_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAvailableYears = async (req, res) => {
  try {
    const data = await service.getAvailableYears();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAll,
  getSummary,
  getYearlySummary,
  getEmployeeSummary,
  getAvailableYears,
};
