const pool = require("../config/db");

const getAll = async ({ page = 1, limit = 50, status, device_id, date_from, date_to }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`a.status = $${idx++}`);
    params.push(status);
  }
  if (device_id) {
    conditions.push(`a.device_id = $${idx++}`);
    params.push(parseInt(device_id));
  }
  if (date_from) {
    conditions.push(`a.log_timestamp >= $${idx++}`);
    params.push(date_from);
  }
  if (date_to) {
    conditions.push(`a.log_timestamp <= $${idx++}`);
    params.push(date_to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `SELECT COUNT(*) FROM attendance_logs a ${where}`;
  const { rows: [{ count }] } = await pool.query(countQuery, params);

  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT a.*, d.name AS device_name, e.first_name || ' ' || e.last_name AS employee_name
    FROM attendance_logs a
    LEFT JOIN devices d ON d.id = a.device_id
    LEFT JOIN employees e ON e.id = a.employee_id
    ${where}
    ORDER BY a.log_timestamp DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(limit, offset);
  const { rows } = await pool.query(dataQuery, params);

  return { data: rows, pagination: { total: parseInt(count), page, limit, totalPages: Math.ceil(parseInt(count) / limit) } };
};

const create = async ({ raw_log_id, device_id, employee_code, employee_id, log_timestamp, status, error_message }) => {
  const { rows } = await pool.query(
    `INSERT INTO attendance_logs (raw_log_id, device_id, employee_code, employee_id, log_timestamp, status, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [raw_log_id, device_id, employee_code, employee_id, log_timestamp, status || "PENDING", error_message || null]
  );
  return rows[0];
};

const updateStatus = async (id, status, employee_id, error_message) => {
  const { rows } = await pool.query(
    `UPDATE attendance_logs SET status = $1, employee_id = COALESCE($2, employee_id), error_message = $3,
     processed_at = CASE WHEN $1 IN ('PROCESSED','ERROR') THEN NOW() ELSE processed_at END
     WHERE id = $4 RETURNING *`,
    [status, employee_id, error_message || null, id]
  );
  return rows[0];
};

const getPending = async (limit = 100) => {
  const { rows } = await pool.query(
    "SELECT * FROM attendance_logs WHERE status IN ('PENDING','MATCHED') ORDER BY log_timestamp ASC LIMIT $1",
    [limit]
  );
  return rows;
};

const getByRawLogId = async (raw_log_id) => {
  const { rows } = await pool.query(
    "SELECT * FROM attendance_logs WHERE raw_log_id = $1 ORDER BY created_at DESC",
    [raw_log_id]
  );
  return rows;
};

module.exports = { getAll, create, updateStatus, getPending, getByRawLogId };
