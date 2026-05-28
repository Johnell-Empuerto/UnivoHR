const jobPositionService = require("../services/jobPosition.service");
const audit = require("../services/audit.service");

const getAll = async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;
    const result = await jobPositionService.getAll(page, limit, search, status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllActive = async (req, res) => {
  try {
    const positions = await jobPositionService.getAllActive();
    res.json(positions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const position = await jobPositionService.getById(req.params.id);
    res.json(position);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const position = await jobPositionService.create(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "job_positions",
      record_id: position.id,
      new_values: { title: position.title, department: position.department, status: position.status },
      description: `Job position created: ${position.title}`,
    });
    res.status(201).json(position);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const oldValues = await audit.fetchOldValues("job_positions", req.params.id);
    const position = await jobPositionService.update(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "job_positions",
      record_id: position.id,
      old_values: oldValues ? { title: oldValues.title, department: oldValues.department, status: oldValues.status } : null,
      new_values: { title: position.title, department: position.department, status: position.status },
      description: `Job position updated: ${position.title}`,
    });
    res.json(position);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const position = await jobPositionService.remove(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "job_positions",
      record_id: position.id,
      new_values: { title: position.title },
      description: `Job position deleted: ${position.title}`,
    });
    res.json({ message: "Job position deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getAllActive,
  getById,
  create,
  update,
  remove,
};
