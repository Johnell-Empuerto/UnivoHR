const pool = require("../config/db");

const getAllTemplates = async (search = "", page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const q = `%${search}%`;
  const data = await pool.query(
    `SELECT kt.*, (SELECT COUNT(*) FROM kpi_template_items WHERE template_id = kt.id) AS item_count
     FROM kpi_templates kt
     WHERE $1 = '' OR kt.name ILIKE $1 OR kt.department ILIKE $1
     ORDER BY kt.created_at DESC LIMIT $2 OFFSET $3`,
    [q, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*) FROM kpi_templates WHERE $1 = '' OR name ILIKE $1 OR department ILIKE $1`,
    [q],
  );
  const total = parseInt(count.rows[0].count);
  return { data: data.rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
};

const getTemplateById = async (id) => {
  const result = await pool.query(`SELECT * FROM kpi_templates WHERE id = $1`, [id]);
  return result.rows[0];
};

const createTemplate = async (data) => {
  const result = await pool.query(
    `INSERT INTO kpi_templates (name, description, department) VALUES ($1,$2,$3) RETURNING *`,
    [data.name, data.description || null, data.department || null],
  );
  return result.rows[0];
};

const updateTemplate = async (id, data) => {
  const result = await pool.query(
    `UPDATE kpi_templates SET name=$1, description=$2, department=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
    [data.name, data.description || null, data.department || null, id],
  );
  return result.rows[0];
};

const toggleTemplateActive = async (id, isActive) => {
  const result = await pool.query(
    `UPDATE kpi_templates SET is_active=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
    [isActive, id],
  );
  return result.rows[0];
};

const deleteTemplate = async (id) => {
  await pool.query(`DELETE FROM kpi_templates WHERE id=$1`, [id]);
};

const getItemsByTemplateId = async (templateId) => {
  const result = await pool.query(
    `SELECT * FROM kpi_template_items WHERE template_id=$1 ORDER BY id`,
    [templateId],
  );
  return result.rows;
};

const createItem = async (data) => {
  const result = await pool.query(
    `INSERT INTO kpi_template_items (template_id, kpi_name, description, weight) VALUES ($1,$2,$3,$4) RETURNING *`,
    [data.template_id, data.kpi_name, data.description || null, data.weight || 0],
  );
  return result.rows[0];
};

const updateItem = async (id, data) => {
  const result = await pool.query(
    `UPDATE kpi_template_items SET kpi_name=$1, description=$2, weight=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
    [data.kpi_name, data.description || null, data.weight || 0, id],
  );
  return result.rows[0];
};

const deleteItem = async (id) => {
  await pool.query(`DELETE FROM kpi_template_items WHERE id=$1`, [id]);
};

const isTemplateInUse = async (templateId) => {
  const result = await pool.query(
    `SELECT 1 FROM employee_kpi_evaluations WHERE template_id = $1 LIMIT 1`,
    [templateId],
  );
  return result.rows.length > 0;
};

const getTemplateByName = async (name, excludeId) => {
  const result = await pool.query(
    `SELECT id FROM kpi_templates WHERE name = $1 AND ($2 IS NULL OR id != $2) LIMIT 1`,
    [name, excludeId || null],
  );
  return result.rows[0];
};

const isItemInUse = async (itemId) => {
  const result = await pool.query(
    `SELECT 1 FROM employee_kpi_scores WHERE template_item_id = $1 LIMIT 1`,
    [itemId],
  );
  return result.rows.length > 0;
};

const getActiveTemplates = async () => {
  const result = await pool.query(
    `SELECT * FROM kpi_templates WHERE is_active = TRUE ORDER BY name`,
  );
  return result.rows;
};

module.exports = {
  getAllTemplates, getTemplateById, createTemplate, updateTemplate,
  toggleTemplateActive, deleteTemplate, isTemplateInUse,
  getItemsByTemplateId, createItem, updateItem, deleteItem,
  getActiveTemplates, getTemplateByName, isItemInUse,
};
