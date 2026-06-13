const service = require("../services/kpiTemplate.service");
const audit = require("../services/audit.service");

const getAll = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const result = await service.getAll(search, Number(page), Number(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const result = await service.getById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const result = await service.create(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "kpi_templates",
      record_id: result.id,
      new_values: { name: result.name, department: result.department, is_active: result.is_active },
      description: `KPI template created: ${result.name}`,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const result = await service.update(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "kpi_templates",
      record_id: Number(req.params.id),
      new_values: { name: result.name, department: result.department, is_active: result.is_active },
      description: `KPI template updated: ${result.name}`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const toggleActive = async (req, res) => {
  try {
    const result = await service.toggleActive(req.params.id);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "kpi_templates",
      record_id: Number(req.params.id),
      new_values: { is_active: result.is_active },
      description: `KPI template ${result.is_active ? "activated" : "deactivated"} (id: ${req.params.id})`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await service.remove(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "kpi_templates",
      record_id: Number(req.params.id),
      description: `KPI template deleted (id: ${req.params.id})`,
    });
    res.json({ message: "Template deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getItems = async (req, res) => {
  try {
    const items = await service.getItems(req.params.templateId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addItem = async (req, res) => {
  try {
    const item = await service.addItem(req.params.templateId, req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "kpi_template_items",
      record_id: item.id,
      new_values: { kpi_name: item.kpi_name, weight: item.weight, template_id: req.params.templateId },
      description: `KPI template item created: ${item.kpi_name} (template ${req.params.templateId})`,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const editItem = async (req, res) => {
  try {
    const item = await service.editItem(req.params.itemId, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "kpi_template_items",
      record_id: Number(req.params.itemId),
      new_values: { kpi_name: item.kpi_name, weight: item.weight },
      description: `KPI template item updated: ${item.kpi_name} (id: ${req.params.itemId})`,
    });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const removeItem = async (req, res) => {
  try {
    await service.removeItem(req.params.itemId);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "kpi_template_items",
      record_id: Number(req.params.itemId),
      description: `KPI template item deleted (id: ${req.params.itemId})`,
    });
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getActiveTemplates = async (req, res) => {
  try {
    const templates = await service.getActiveTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAll, getById, create, update, toggleActive, remove,
  getItems, addItem, editItem, removeItem, getActiveTemplates,
};
