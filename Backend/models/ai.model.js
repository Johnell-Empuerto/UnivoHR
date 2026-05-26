const pool = require("../config/db");

const toPgArray = (arr) => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
  return "{" + arr.map(e => {
    const s = String(e).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return /[{}",\\\s]/.test(s) ? `"${s}"` : s;
  }).join(",") + "}";
};

// ========== SESSIONS ==========

const createSession = async ({ user_id, title }) => {
  const result = await pool.query(`
    INSERT INTO ai_chat_sessions (user_id, title, last_message_at)
    VALUES ($1, $2, NOW())
    RETURNING *
  `, [user_id, title]);
  return result.rows[0];
};

const getSessions = async ({ user_id, status, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  conditions.push(`user_id = $${idx++}`);
  params.push(user_id);

  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const where = "WHERE " + conditions.join(" AND ");

  const data = await pool.query(`
    SELECT * FROM ai_chat_sessions ${where}
    ORDER BY last_message_at DESC NULLS LAST
    LIMIT $${idx++} OFFSET $${idx++}
  `, [...params, limit, offset]);

  const count = await pool.query(`
    SELECT COUNT(*) FROM ai_chat_sessions ${where}
  `, params);

  const total = parseInt(count.rows[0].count);
  return {
    data: data.rows,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getSessionById = async (id, user_id) => {
  const result = await pool.query(`
    SELECT * FROM ai_chat_sessions
    WHERE id = $1 AND user_id = $2 AND status != 'DELETED'
  `, [id, user_id]);
  return result.rows[0] || null;
};

const updateSession = async (id, fields) => {
  const setClauses = [];
  const params = [];
  let idx = 1;

  if (fields.title !== undefined) {
    setClauses.push(`title = $${idx++}`);
    params.push(fields.title);
  }
  if (fields.status !== undefined) {
    setClauses.push(`status = $${idx++}`);
    params.push(fields.status);
  }
  setClauses.push(`updated_at = NOW()`);
  if (fields.touchLastMessage) {
    setClauses.push(`last_message_at = NOW()`);
  }

  params.push(id);
  const result = await pool.query(`
    UPDATE ai_chat_sessions SET ${setClauses.join(", ")}
    WHERE id = $${idx}
    RETURNING *
  `, params);
  return result.rows[0] || null;
};

const deleteSession = async (id, user_id) => {
  const result = await pool.query(`
    UPDATE ai_chat_sessions SET status = 'DELETED', updated_at = NOW()
    WHERE id = $1 AND user_id = $2 AND status != 'DELETED'
    RETURNING *
  `, [id, user_id]);
  return result.rows[0] || null;
};

// ========== MESSAGES ==========

const createMessage = async ({ session_id, user_id, role, content, intent, metadata }) => {
  const result = await pool.query(`
    INSERT INTO ai_chat_messages (session_id, user_id, role, content, intent, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [session_id, user_id, role, content, intent || null, JSON.stringify(metadata || {})]);
  return result.rows[0];
};

const getMessagesBySession = async (session_id, user_id) => {
  const result = await pool.query(`
    SELECT * FROM ai_chat_messages
    WHERE session_id = $1 AND user_id = $2
    ORDER BY created_at ASC
  `, [session_id, user_id]);
  return result.rows;
};

// ========== AUDIT LOGS ==========

const createAuditLog = async ({ user_id, session_id, question, detected_intent, data_scope, used_modules, response_status, error_message, entities, accessed_employee_id, accessed_branch_id, accessed_department, permission_result, denied_reason, response_time_ms }) => {
  const result = await pool.query(`
    INSERT INTO ai_audit_logs (user_id, session_id, question, detected_intent, data_scope, used_modules, response_status, error_message, entities, accessed_employee_id, accessed_branch_id, accessed_department, permission_result, denied_reason, response_time_ms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `, [
    user_id,
    session_id || null,
    question,
    detected_intent || null,
    data_scope || null,
    toPgArray(used_modules),
    response_status || 'SUCCESS',
    error_message || null,
    entities ? JSON.stringify(entities) : null,
    accessed_employee_id || null,
    accessed_branch_id || null,
    accessed_department || null,
    permission_result || 'GRANTED',
    denied_reason || null,
    response_time_ms || null,
  ]);
  return result.rows[0];
};

// ========== FEEDBACK ==========

const createFeedback = async ({ message_id, user_id, rating, comment }) => {
  const result = await pool.query(`
    INSERT INTO ai_feedback (message_id, user_id, rating, comment)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [message_id, user_id, rating, comment || null]);
  return result.rows[0];
};

// ========== TEMPLATES ==========

const getActiveTemplates = async (roles) => {
  const result = await pool.query(`
    SELECT intent, display_name, description, sample_questions, module_name
    FROM ai_query_templates
    WHERE is_active = true
      AND required_roles && $1::varchar[]
    ORDER BY display_name
  `, [roles]);
  return result.rows;
};

const getTemplateByIntent = async (intent) => {
  const result = await pool.query(`
    SELECT * FROM ai_query_templates WHERE intent = $1
  `, [intent]);
  return result.rows[0] || null;
};

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  createMessage,
  getMessagesBySession,
  createAuditLog,
  createFeedback,
  getActiveTemplates,
  getTemplateByIntent,
};
