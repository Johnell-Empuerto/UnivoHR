const pool = require("../config/db");

const createSession = async ({ user_id, refresh_token_hash, ip_address, user_agent, expires_at }) => {
  const result = await pool.query(
    `INSERT INTO user_sessions (user_id, refresh_token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, is_active, expires_at, created_at`,
    [user_id, refresh_token_hash, ip_address || "", user_agent || "", expires_at],
  );
  return result.rows[0];
};

const findActiveSession = async (sessionId, userId) => {
  const result = await pool.query(
    `SELECT id, user_id, refresh_token_hash, is_active, expires_at
     FROM user_sessions
     WHERE id = $1 AND user_id = $2 AND is_active = true`,
    [sessionId, userId],
  );
  return result.rows[0] || null;
};

const deactivateSession = async (sessionId) => {
  const result = await pool.query(
    `UPDATE user_sessions SET is_active = false WHERE id = $1 RETURNING id`,
    [sessionId],
  );
  return result.rows[0] || null;
};

const deactivateAllUserSessions = async (userId) => {
  await pool.query(
    `UPDATE user_sessions SET is_active = false WHERE user_id = $1 AND is_active = true`,
    [userId],
  );
};

const countActiveSessions = async (userId) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM user_sessions WHERE user_id = $1 AND is_active = true`,
    [userId],
  );
  return result.rows[0].count;
};

const updateSessionHash = async (sessionId, refreshTokenHash) => {
  await pool.query(
    `UPDATE user_sessions SET refresh_token_hash = $1 WHERE id = $2`,
    [refreshTokenHash, sessionId],
  );
};

const updateLastActivity = async (sessionId) => {
  await pool.query(
    `UPDATE user_sessions SET last_activity_at = NOW() WHERE id = $1`,
    [sessionId],
  );
};

const getOldestActiveSession = async (userId) => {
  const result = await pool.query(
    `SELECT id FROM user_sessions
     WHERE user_id = $1 AND is_active = true
     ORDER BY created_at ASC
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] || null;
};

module.exports = {
  createSession,
  findActiveSession,
  deactivateSession,
  deactivateAllUserSessions,
  countActiveSessions,
  getOldestActiveSession,
  updateSessionHash,
  updateLastActivity,
};
