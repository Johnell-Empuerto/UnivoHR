const pool = require("../config/db");
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
const remove = async (id) => {
  const existing = await shiftModel.getById(id);
  if (!existing) {
    const err = new Error("Shift not found");
    err.statusCode = 404;
    throw err;
  }

  const dependencies = [];

  const assignCheck = await pool.query(
    `SELECT COUNT(*) AS cnt FROM employee_shift_assignments WHERE shift_id = $1`,
    [id],
  );
  if (parseInt(assignCheck.rows[0].cnt) > 0) {
    dependencies.push({ entity: "employee_shift_assignments", label: "employee shift assignments" });
  }

  const attendanceCheck = await pool.query(
    `SELECT COUNT(*) AS cnt FROM attendance WHERE shift_id = $1`,
    [id],
  );
  if (parseInt(attendanceCheck.rows[0].cnt) > 0) {
    dependencies.push({ entity: "attendance", label: "attendance records" });
  }

  const rotationCheck = await pool.query(
    `SELECT COUNT(*) AS cnt FROM rotation_pattern_steps WHERE shift_id = $1`,
    [id],
  );
  if (parseInt(rotationCheck.rows[0].cnt) > 0) {
    dependencies.push({ entity: "rotation_pattern_steps", label: "rotation pattern steps" });
  }

  if (dependencies.length > 0) {
    const err = new Error("This shift is currently being used and cannot be deleted.");
    err.statusCode = 409;
    err.dependencies = dependencies;
    throw err;
  }

  return await shiftModel.remove(id);
};
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
