const employeeModel = require("../models/employee.model");

const getEmployees = async (page, limit, search, status, allowedBranchIds) => {
  return await employeeModel.getEmployees(page, limit, search, status, allowedBranchIds);
};

const createEmployee = async (data) => {
  return await employeeModel.createEmployee(data);
};

const updateEmployee = async (id, data) => {
  return await employeeModel.updateEmployee(id, data);
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
};
