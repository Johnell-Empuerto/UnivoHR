const pool = require("../config/db");

const createNotification = async (data) => {
  const { user_id, type, title, message, reference_id, meta } = data;

  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, reference_id, meta)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, type, title, message, reference_id || null, meta || null],
  );
  return result.rows[0];
};

const getByUser = async (user_id, limit = 20, offset = 0) => {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [user_id, limit, offset],
  );
  return result.rows;
};

const getTotalCount = async (user_id) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1`,
    [user_id],
  );
  return parseInt(result.rows[0].count);
};

const getUnreadCount = async (user_id) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications
     WHERE user_id = $1 AND is_read = false`,
    [user_id],
  );
  return parseInt(result.rows[0].count);
};

const markAsRead = async (id, user_id) => {
  const result = await pool.query(
    `UPDATE notifications 
     SET is_read = true 
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, user_id],
  );
  return result.rows[0];
};

const markAllAsRead = async (user_id) => {
  const result = await pool.query(
    `UPDATE notifications 
     SET is_read = true 
     WHERE user_id = $1 AND is_read = false
     RETURNING *`,
    [user_id],
  );
  return result.rows;
};

module.exports = {
  createNotification,
  getByUser,
  getTotalCount,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
