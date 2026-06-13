const shiftModel = require("../models/shift.model");

const getAll = async () => shiftModel.getAll();
const getById = async (id) => shiftModel.getById(id);
const create = async (data) => {
  const enriched = {
    ...data,
    is_night_shift: data.type === 'NIGHT' ? true : (data.is_night_shift || false),
    is_flexitime: data.type === 'FLEXITIME' ? true : (data.is_flexitime || false),
  };
  return shiftModel.create(enriched);
};
const update = async (id, data) => {
  const enriched = { ...data };
  if (data.type) {
    enriched.is_night_shift = data.type === 'NIGHT';
    enriched.is_flexitime = data.type === 'FLEXITIME';
  }
  return shiftModel.update(id, enriched);
};
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
