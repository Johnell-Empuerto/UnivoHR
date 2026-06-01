const shiftModel = require("../models/shift.model");

const getAll = async () => shiftModel.getAll();
const getById = async (id) => shiftModel.getById(id);
const create = async (data) => shiftModel.create(data);
const update = async (id, data) => shiftModel.update(id, data);
const remove = async (id) => shiftModel.remove(id);
const getActiveShifts = async () => shiftModel.getActiveShifts();
const getEmployeeShiftForDate = async (employeeId, date) =>
  shiftModel.getEmployeeShiftForDate(employeeId, date);
const assignShift = async (employeeId, shiftId, effectiveDate, endDate) =>
  shiftModel.assignShift(employeeId, shiftId, effectiveDate, endDate);
const getAssignments = async (employeeId) =>
  shiftModel.getAssignments(employeeId);
const removeAssignment = async (id) => shiftModel.removeAssignment(id);

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getActiveShifts,
  getEmployeeShiftForDate,
  assignShift,
  getAssignments,
  removeAssignment,
};
