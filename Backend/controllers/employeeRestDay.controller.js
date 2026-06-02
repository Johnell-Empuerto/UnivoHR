const employeeRestDayService = require("../services/employeeRestDay.service");

const getByEmployee = async (req, res) => {
  try {
    const rows = await employeeRestDayService.getByEmployeeId(req.params.employeeId);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const row = await employeeRestDayService.create({
      employee_id: req.params.employeeId,
      day_of_week: req.body.day_of_week,
      effective_date: req.body.effective_date,
      end_date: req.body.end_date,
    });
    res.status(201).json(row);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const row = await employeeRestDayService.update(req.params.id, req.body);
    if (!row) return res.status(404).json({ message: "Rest day not found" });
    res.json(row);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const row = await employeeRestDayService.remove(req.params.id);
    if (!row) return res.status(404).json({ message: "Rest day not found" });
    res.json({ message: "Rest day removed", data: row });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getByEmployee,
  create,
  update,
  remove,
};
