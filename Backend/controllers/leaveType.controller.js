const pool = require("../config/db");
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

    const dependencies = [];

    const balanceCheck = await pool.query(
      `SELECT COUNT(*) AS cnt FROM employee_leave_balances WHERE leave_type_id = $1`,
      [req.params.id],
    );
    if (parseInt(balanceCheck.rows[0].cnt) > 0) {
      dependencies.push({ entity: "employee_leave_balances", label: "employee leave balances" });
    }

    const leaveCheck = await pool.query(
      `SELECT COUNT(*) AS cnt FROM leaves WHERE type = $1`,
      [existing.code],
    );
    if (parseInt(leaveCheck.rows[0].cnt) > 0) {
      dependencies.push({ entity: "leaves", label: "leave requests" });
    }

    const conversionCheck = await pool.query(
      `SELECT COUNT(*) AS cnt FROM leave_conversions WHERE leave_type = $1`,
      [existing.code],
    );
    if (parseInt(conversionCheck.rows[0].cnt) > 0) {
      dependencies.push({ entity: "leave_conversions", label: "leave conversions" });
    }

    if (dependencies.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete "${existing.name}" — it has been used by existing records. Disable it instead if you no longer want it available.`,
        dependencies,
      });
    }

    await leaveTypeModel.hardRemove(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "leave_types",
      record_id: existing.id,
      old_values: {
        code: existing.code,
        name: existing.name,
        is_enabled: existing.is_enabled,
      },
      description: `Leave type '${existing.code}' permanently deleted`,
    });
    res.json({ message: `Leave type "${existing.name}" permanently deleted` });
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
