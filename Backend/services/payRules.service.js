const calendarModel = require("../models/payRules.model");

// PAY RULES
const getAllPayRules = async () => {
  return await calendarModel.getAllPayRules();
};

const getPayRuleById = async (id) => {
  const rule = await calendarModel.getPayRuleById(id);
  if (!rule) throw new Error("NOT_FOUND");
  return rule;
};

const createPayRule = async (data) => {
  const { day_type, multiplier } = data;

  if (!day_type || multiplier === undefined) {
    throw new Error("VALIDATION_ERROR");
  }

  return await calendarModel.createPayRule(data);
};

const updatePayRule = async (id, data) => {
  const rule = await calendarModel.updatePayRule(id, data);
  if (!rule) throw new Error("NOT_FOUND");
  return rule;
};

const deletePayRule = async (id) => {
  const rule = await calendarModel.deletePayRule(id);
  if (!rule) throw new Error("NOT_FOUND");
  return rule;
};

// CALENDAR
const getCalendarDays = async (start_date, end_date) => {
  if (!start_date || !end_date) {
    throw new Error("VALIDATION_ERROR");
  }

  return await calendarModel.getCalendarDays(start_date, end_date);
};

const upsertCalendarDay = async (data) => {
  const { date, day_type } = data;

  if (!date || !day_type) {
    throw new Error("VALIDATION_ERROR");
  }

  return await calendarModel.upsertCalendarDay(data);
};

const deleteCalendarDay = async (date) => {
  const day = await calendarModel.deleteCalendarDay(date);
  if (!day) throw new Error("NOT_FOUND");
  return day;
};

module.exports = {
  getAllPayRules,
  getPayRuleById,
  createPayRule,
  updatePayRule,
  deletePayRule,
  getCalendarDays,
  upsertCalendarDay,
  deleteCalendarDay,
};
