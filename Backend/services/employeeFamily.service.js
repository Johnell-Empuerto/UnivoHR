const model = require("../models/employeeFamily.model");
const employeeModel = require("../models/employee.model");

const getByEmployeeId = async (employeeId) => {
  return await model.getAllByEmployeeId(employeeId);
};

const create = async (data) => {
  const emp = await employeeModel.getEmployeeById(data.employee_id);
  if (!emp) throw new Error("Employee not found");
  return await model.create(data);
};

const update = async (id, data) => {
  const existing = await model.getById(id);
  if (!existing) throw new Error("Family member not found");
  return await model.update(id, data);
};

const remove = async (id) => {
  const existing = await model.getById(id);
  if (!existing) throw new Error("Family member not found");
  await model.remove(id);
};

module.exports = { getByEmployeeId, create, update, remove };
