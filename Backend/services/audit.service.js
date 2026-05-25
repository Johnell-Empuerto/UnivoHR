const pool = require("../config/db");

const log = async ({ actor_id, action, entity_type, entity_id, old_values, new_values, req }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        actor_id || null,
        action,
        entity_type,
        entity_id || null,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        req?.ip ? (req.ip.includes('::') ? req.ip.split(':').pop() : req.ip) : null,
        req?.headers?.['user-agent'] || null,
      ],
    );
  } catch (err) {
    console.error("[Audit] Failed to log:", err.message);
  }
};

module.exports = { log };
