const leaveTypeModel = require("../models/leaveType.model");
const audit = require("../services/audit.service");

const getAll = async (req, res) => {
  try {
    const types = await leaveTypeModel.getAll();
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const type = await leaveTypeModel.getById(req.params.id);
    if (!type) return res.status(404).json({ message: "Leave type not found" });
    res.json(type);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const existing = await leaveTypeModel.getByCode(req.body.code);
    if (existing) {
      return res.status(409).json({ message: `Leave type with code '${req.body.code}' already exists` });
    }
    const type = await leaveTypeModel.create(req.body);
    audit.auditLog(req, {
      action: "CREATE",
      table_name: "leave_types",
      record_id: type.id,
      new_values: req.body,
      description: `Leave type '${type.code}' created`,
    });
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const existing = await leaveTypeModel.getById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Leave type not found" });
    if (req.body.code && req.body.code !== existing.code) {
      const dup = await leaveTypeModel.getByCode(req.body.code);
      if (dup) return res.status(409).json({ message: `Leave type with code '${req.body.code}' already exists` });
    }
    const type = await leaveTypeModel.update(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "leave_types",
      record_id: type.id,
      new_values: req.body,
      description: `Leave type '${type.code}' updated`,
    });
    res.json(type);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleEnabled = async (req, res) => {
  try {
    const existing = await leaveTypeModel.getById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Leave type not found" });
    const type = await leaveTypeModel.toggleEnabled(req.params.id);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "leave_types",
      record_id: type.id,
      new_values: { is_enabled: type.is_enabled },
      description: `Leave type '${type.code}' ${type.is_enabled ? 'enabled' : 'disabled'}`,
    });
    res.json(type);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const existing = await leaveTypeModel.getById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Leave type not found" });
    if (existing.is_enabled) {
      await leaveTypeModel.update(req.params.id, { is_enabled: false });
    }
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "leave_types",
      record_id: existing.id,
      description: `Leave type '${existing.code}' soft-deleted (disabled)`,
    });
    res.json({ message: "Leave type disabled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  toggleEnabled,
  remove,
};
