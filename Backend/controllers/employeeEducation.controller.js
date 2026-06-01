const service = require("../services/employeeEducation.service");

const getByEmployeeId = async (req, res) => {
  try {
    const result = await service.getByEmployeeId(req.params.employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const result = await service.create({ ...req.body, employee_id: Number(req.params.employeeId) });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const result = await service.update(Number(req.params.id), req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await service.remove(Number(req.params.id));
    res.json({ message: "Education record deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getByEmployeeId, create, update, remove };
