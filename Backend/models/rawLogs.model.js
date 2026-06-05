const pool = require("../config/db");

const insertLog = async ({ employee_code, timestamp, device_id, raw_payload, source }) => {
  const query = `
    INSERT INTO raw_logs (employee_code, timestamp, device_id, raw_payload, source, status)
    VALUES ($1, $2, $3, $4, $5, 'PENDING')
    RETURNING *
  `;
  const { rows } = await pool.query(query, [employee_code, timestamp, device_id, raw_payload, source || "API"]);
  return rows[0];
};

const getAll = async ({ page = 1, limit = 50, device_id, status, source, search, date_from, date_to }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (device_id) {
    conditions.push(`r.device_id = $${idx++}`);
    params.push(parseInt(device_id));
  }
  if (status) {
    conditions.push(`r.status = $${idx++}`);
    params.push(status);
  }
  if (source) {
    conditions.push(`r.source = $${idx++}`);
    params.push(source);
  }
  if (search) {
    conditions.push(`r.employee_code ILIKE $${idx++}`);
    params.push(`%${search}%`);
  }
  if (date_from) {
    conditions.push(`r.timestamp >= $${idx++}`);
    params.push(date_from);
  }
  if (date_to) {
    conditions.push(`r.timestamp <= $${idx++}`);
    params.push(date_to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countQuery = `SELECT COUNT(*) FROM raw_logs r ${where}`;
  const { rows: [{ count }] } = await pool.query(countQuery, params);

  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT r.*, d.name AS device_name
    FROM raw_logs r
    LEFT JOIN devices d ON d.id = r.device_id
    ${where}
    ORDER BY r.timestamp DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(limit, offset);
  const { rows } = await pool.query(dataQuery, params);

  return { data: rows, pagination: { total: parseInt(count), page, limit, totalPages: Math.ceil(parseInt(count) / limit) } };
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT r.*, d.name AS device_name FROM raw_logs r LEFT JOIN devices d ON d.id = r.device_id WHERE r.id = $1`,
    [id]
  );
  return rows[0];
};

const updateStatus = async (id, status, errorMessage) => {
  const { rows } = await pool.query(
    `UPDATE raw_logs SET status = $1, error_message = $2, processed_at = CASE WHEN $4 IN ('PROCESSED','FAILED','DUPLICATE') THEN NOW() ELSE processed_at END WHERE id = $3 RETURNING *`,
    [status, errorMessage || null, id, status]
  );
  return rows[0];
};

const bulkInsert = async (logs) => {
  if (!logs.length) return [];
  const values = [];
  const params = [];
  let idx = 1;

  for (const log of logs) {
    values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    params.push(log.employee_code || null, log.timestamp, log.device_id || null, log.raw_payload || null, log.source || "IMPORT", "PENDING");
  }

  const query = `
    INSERT INTO raw_logs (employee_code, timestamp, device_id, raw_payload, source, status)
    VALUES ${values.join(", ")}
    RETURNING *
  `;
  const { rows } = await pool.query(query, params);
  return rows;
};

const getPendingCount = async () => {
  const { rows: [{ count }] } = await pool.query("SELECT COUNT(*) FROM raw_logs WHERE status = 'PENDING'");
  return parseInt(count);
};

const getPendingBatch = async (limit = 100) => {
  const { rows } = await pool.query(
    "SELECT * FROM raw_logs WHERE status = 'PENDING' ORDER BY timestamp ASC LIMIT $1",
    [limit]
  );
  return rows;
};

const getByIdWithDevice = async (id) => {
  const { rows } = await pool.query(
    `SELECT r.*, d.name AS device_name, d.type AS device_type
     FROM raw_logs r
     LEFT JOIN devices d ON d.id = r.device_id
     WHERE r.id = $1`,
    [id]
  );
  return rows[0];
};

const startProcessing = async (limit = 10) => {
  const { rows } = await pool.query(
    `UPDATE raw_logs SET status = 'PROCESSING', processing_started_at = NOW()
     WHERE id IN (
       SELECT id FROM raw_logs
       WHERE status IN ('PENDING', 'FAILED')
       ORDER BY timestamp ASC
       LIMIT $1
     )
     RETURNING *`,
    [limit]
  );
  return rows;
};

const incrementRetry = async (id) => {
  const { rows } = await pool.query(
    `UPDATE raw_logs SET retry_count = retry_count + 1, last_retry_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
};

const updateEmployeeCode = async (id, employee_code) => {
  const { rows } = await pool.query(
    `UPDATE raw_logs SET employee_code = $1 WHERE id = $2 RETURNING *`,
    [employee_code, id]
  );
  return rows[0];
};

module.exports = { insertLog, getAll, getById, updateStatus, bulkInsert, getPendingCount, getPendingBatch, getByIdWithDevice, startProcessing, incrementRetry, updateEmployeeCode };
