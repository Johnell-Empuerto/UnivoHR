const service = require("../services/kpiTemplate.service");

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
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const result = await service.update(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const toggleActive = async (req, res) => {
  try {
    const result = await service.toggleActive(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await service.remove(req.params.id);
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
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const editItem = async (req, res) => {
  try {
    const item = await service.editItem(req.params.itemId, req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const removeItem = async (req, res) => {
  try {
    await service.removeItem(req.params.itemId);
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
