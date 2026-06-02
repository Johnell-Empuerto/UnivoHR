const employeeRestDayModel = require("../models/employeeRestDay.model");

const getByEmployeeId = (employeeId) =>
  employeeRestDayModel.getByEmployeeId(employeeId);

const getByEmployeeIds = (employeeIds) =>
  employeeRestDayModel.getByEmployeeIds(employeeIds);

const create = (data) =>
  employeeRestDayModel.create(data);

const update = (id, data) =>
  employeeRestDayModel.update(id, data);

const remove = (id) =>
  employeeRestDayModel.remove(id);

const removeByEmployeeId = (employeeId) =>
  employeeRestDayModel.removeByEmployeeId(employeeId);

module.exports = {
  getByEmployeeId,
  getByEmployeeIds,
  create,
  update,
  remove,
  removeByEmployeeId,
};
