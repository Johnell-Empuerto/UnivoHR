const calendarService = require("../services/calendar.service");

// GET ALL
const getCalendar = async (req, res) => {
  try {
    const { start, end } = req.query;
    const data = await calendarService.getCalendar(start, end);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ONE BY DATE
const getByDate = async (req, res) => {
  try {
    const data = await calendarService.getByDate(req.params.date);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE
const create = async (req, res) => {
  try {
    const data = await calendarService.create(req.body);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE
const update = async (req, res) => {
  try {
    const data = await calendarService.update(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
const remove = async (req, res) => {
  try {
    const data = await calendarService.remove(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getCalendar,
  getByDate,
  create,
  update,
  remove,
};
