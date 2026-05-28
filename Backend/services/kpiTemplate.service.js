const model = require("../models/kpiTemplate.model");

const getAll = async (search, page, limit) => {
  return await model.getAllTemplates(search, page, limit);
};

const getById = async (id) => {
  const template = await model.getTemplateById(id);
  if (!template) throw new Error("Template not found");
  const items = await model.getItemsByTemplateId(id);
  return { ...template, items };
};

const create = async (data) => {
  if (!data.name || !data.name.trim()) throw new Error("Template name is required");
  return await model.createTemplate(data);
};

const update = async (id, data) => {
  const existing = await model.getTemplateById(id);
  if (!existing) throw new Error("Template not found");
  return await model.updateTemplate(id, data);
};

const toggleActive = async (id) => {
  const existing = await model.getTemplateById(id);
  if (!existing) throw new Error("Template not found");
  return await model.toggleTemplateActive(id, !existing.is_active);
};

const remove = async (id) => {
  const existing = await model.getTemplateById(id);
  if (!existing) throw new Error("Template not found");
  await model.deleteTemplate(id);
};

const getItems = async (templateId) => {
  return await model.getItemsByTemplateId(templateId);
};

const addItem = async (templateId, data) => {
  const existing = await model.getTemplateById(templateId);
  if (!existing) throw new Error("Template not found");
  if (!data.kpi_name || !data.kpi_name.trim()) throw new Error("KPI name is required");
  const item = await model.createItem({ ...data, template_id: templateId });
  const items = await model.getItemsByTemplateId(templateId);
  const totalWeight = items.reduce((s, i) => s + parseFloat(i.weight || 0), 0);
  if (totalWeight > 100) throw new Error("Total weight exceeds 100. Please adjust item weights.");
  return item;
};

const editItem = async (itemId, data) => {
  if (!data.kpi_name || !data.kpi_name.trim()) throw new Error("KPI name is required");
  const item = await model.updateItem(itemId, data);
  const items = await model.getItemsByTemplateId(item.template_id);
  const totalWeight = items.reduce((s, i) => s + parseFloat(i.weight || 0), 0);
  if (totalWeight > 100) throw new Error("Total weight exceeds 100. Please adjust item weights.");
  return item;
};

const removeItem = async (itemId) => {
  await model.deleteItem(itemId);
};

const getActiveTemplates = async () => {
  return await model.getActiveTemplates();
};

module.exports = {
  getAll, getById, create, update, toggleActive, remove,
  getItems, addItem, editItem, removeItem, getActiveTemplates,
};
