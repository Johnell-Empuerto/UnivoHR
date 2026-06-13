const employeeRestDayModel = require("../models/employeeRestDay.model");

const getByEmployeeId = (employeeId) =>
  employeeRestDayModel.getByEmployeeId(employeeId);

const getByEmployeeIds = (employeeIds) =>
  employeeRestDayModel.getByEmployeeIds(employeeIds);

const create = (data) => {
  if (data.day_of_week == null || data.day_of_week < 0 || data.day_of_week > 6) {
    throw new Error("day_of_week must be between 0 and 6");
  }
  return employeeRestDayModel.create(data);
};

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
