const calendarModel = require("../models/calendar.model");

// GET ALL
const getCalendar = async (start, end, branch_id) => {
  return await calendarModel.getCalendar(start, end, branch_id);
};

// GET ONE BY DATE (with branch context)
const getByDate = async (date, branch_id) => {
  return await calendarModel.getByDate(date, branch_id);
};

// CREATE (with duplicate protection per date+branch)
const create = async (data) => {
  const existing = await calendarModel.getByDate(data.date, data.branch_id);

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
  create,
  update,
  remove,
};
