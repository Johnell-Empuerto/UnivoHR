const pool = require("../config/db");

// Get all templates
const getAllTemplates = async () => {
  const result = await pool.query(
    `SELECT id, type, subject, body_html, is_active, created_at, updated_at 
     FROM email_templates 
     ORDER BY type ASC`,
  );
  return result.rows;
};

// Get template by type
const getTemplateByType = async (type) => {
  const result = await pool.query(
    `SELECT * FROM email_templates WHERE type = $1`,
    [type],
  );
  return result.rows[0];
};

// Get active template by type
const getActiveTemplateByType = async (type) => {
  const result = await pool.query(
    `SELECT * FROM email_templates WHERE type = $1 AND is_active = true`,
    [type],
  );
  return result.rows[0];
};

// Create or update template
const upsertTemplate = async (type, subject, body_html, userId) => {
  const result = await pool.query(
    `INSERT INTO email_templates (type, subject, body_html, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (type) 
     DO UPDATE SET 
       subject = EXCLUDED.subject,
       body_html = EXCLUDED.body_html,
       updated_by = EXCLUDED.updated_by,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [type, subject, body_html, userId, userId],
  );
  return result.rows[0];
};

// Update template
const updateTemplate = async (id, subject, body_html, is_active, userId) => {
  const result = await pool.query(
    `UPDATE email_templates 
     SET subject = $1, body_html = $2, is_active = $3, updated_by = $4, updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [subject, body_html, is_active, userId, id],
  );
  return result.rows[0];
};

// Toggle template active status
const toggleTemplate = async (id, is_active, userId) => {
  const result = await pool.query(
    `UPDATE email_templates 
     SET is_active = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [is_active, userId, id],
  );
  return result.rows[0];
};

// Delete template
const deleteTemplate = async (id) => {
  const result = await pool.query(
    `DELETE FROM email_templates WHERE id = $1 RETURNING id`,
    [id],
  );
  return result.rows[0];
};

module.exports = {
  getAllTemplates,
  getTemplateByType,
  getActiveTemplateByType,
  upsertTemplate,
  updateTemplate,
  toggleTemplate,
  deleteTemplate,
};
