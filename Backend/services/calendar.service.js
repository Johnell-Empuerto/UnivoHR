const calendarModel = require("../models/calendar.model");

// GET ALL
const getCalendar = async (start, end) => {
  return await calendarModel.getCalendar(start, end);
};

// GET ONE BY DATE
const getByDate = async (date) => {
  return await calendarModel.getByDate(date);
};

// CREATE (with duplicate protection)
const create = async (data) => {
  const existing = await calendarModel.getByDate(data.date);

  if (existing) {
    throw new Error("Date already exists. Use update instead.");
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
