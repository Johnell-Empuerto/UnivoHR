const historyLeaveModel = require("../models/historyLeave.model");

const getAll = async (page, limit, search, year) => {
  return await historyLeaveModel.getAll(page, limit, search, year);
};

const getSummary = async () => {
  return await historyLeaveModel.getSummary();
};

const getYearlySummary = async () => {
  return await historyLeaveModel.getYearlySummary();
};

const getEmployeeSummary = async (employee_id) => {
  return await historyLeaveModel.getEmployeeSummary(employee_id);
};

const getAvailableYears = async () => {
  return await historyLeaveModel.getAvailableYears();
};

module.exports = {
  getAll,
  getSummary,
  getYearlySummary,
  getEmployeeSummary,
  getAvailableYears,
};
