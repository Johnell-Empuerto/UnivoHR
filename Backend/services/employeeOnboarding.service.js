const employeeOnboardingModel = require("../models/employeeOnboarding.model");
const employeeModel = require("../models/employee.model");

const getAll = async (page, limit, search, status) => {
  return await employeeOnboardingModel.getAll(page, limit, search, status);
};

const getById = async (id) => {
  const onboarding = await employeeOnboardingModel.getById(id);
  if (!onboarding) throw new Error("Onboarding record not found");
  return onboarding;
};

const create = async (data) => {
  if (!data.employee_id) throw new Error("Employee ID is required");
  const employee = await employeeModel.getEmployeeById(data.employee_id);
  if (!employee) throw new Error("Employee not found");
  return await employeeOnboardingModel.create(data);
};

const update = async (id, data) => {
  const existing = await employeeOnboardingModel.getById(id);
  if (!existing) throw new Error("Onboarding record not found");
  return await employeeOnboardingModel.update(id, data);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
};
