const calendarModel = require("../models/calendar.model");

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
  const existing = await calendarModel.getByDateAndBranch(data.date, data.branch_id);

  if (existing) {
    throw new Error("Record already exists for this date and branch. Use update instead.");
  }

  return await calendarModel.create(data);
};

// UPDATE
const update = async (id, data) => {
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
