const calendarModel = require("../models/calendar.model");

const VALID_DAY_TYPES = ["REGULAR", "REGULAR_HOLIDAY", "SPECIAL_HOLIDAY", "SPECIAL_NON_WORKING"];

const validateCalendarInput = (data, requireDate = true) => {
  if (requireDate && !data.date) {
    throw new Error("Date is required");
  }
  if (data.day_type && !VALID_DAY_TYPES.includes(data.day_type)) {
    throw new Error(`Invalid day_type. Must be one of: ${VALID_DAY_TYPES.join(", ")}`);
  }
};

// GET ALL (no branch filter)
const getCalendar = async (start, end) => {
  return await calendarModel.getCalendar(start, end);
};

// GET ONE BY DATE (no branch filter)
const getByDate = async (date) => {
  return await calendarModel.getByDate(date);
};

// GET BY ID
const getById = async (id) => {
  return await calendarModel.getById(id);
};

// CREATE (with duplicate protection per date+branch)
const create = async (data) => {
  validateCalendarInput(data, true);

  const existing = await calendarModel.getByDateAndBranch(data.date, data.branch_id);

  if (existing) {
    throw new Error("Record already exists for this date and branch. Use update instead.");
  }

  return await calendarModel.create(data);
};

// UPDATE
const update = async (id, data) => {
  validateCalendarInput(data, false);
  return await calendarModel.update(id, data);
};

// DELETE
const remove = async (id) => {
  return await calendarModel.remove(id);
};

module.exports = {
  getCalendar,
  getByDate,
  getById,
  create,
  update,
  remove,
};
