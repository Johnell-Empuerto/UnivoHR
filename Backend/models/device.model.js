const pool = require("../config/db");

const getAll = async ({ page = 1, limit = 50, search, status, type }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(`(d.name ILIKE $${idx} OR d.serial_number ILIKE $${idx} OR d.location ILIKE $${idx} OR d.model ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (status) {
    conditions.push(`d.status = $${idx++}`);
    params.push(status);
  }
  if (type) {
    conditions.push(`d.type = $${idx++}`);
    params.push(type);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `SELECT COUNT(*) FROM devices d ${where}`;
  const { rows: [{ count }] } = await pool.query(countQuery, params);

  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT d.*,
      b.name AS branch_name,
      b.timezone AS branch_timezone,
      (SELECT COUNT(*) FROM raw_logs WHERE device_id = d.id) AS total_logs,
      (SELECT COUNT(*) FROM raw_logs WHERE device_id = d.id AND status = 'PENDING') AS pending_logs
    FROM devices d
    LEFT JOIN branches b ON b.id = d.branch_id
    ${where}
    ORDER BY d.name ASC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(limit, offset);
  const { rows } = await pool.query(dataQuery, params);

  return { data: rows, pagination: { total: parseInt(count), page, limit, totalPages: Math.ceil(parseInt(count) / limit) } };
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT d.*,
      b.name AS branch_name,
      b.timezone AS branch_timezone,
      (SELECT COUNT(*) FROM raw_logs WHERE device_id = d.id) AS total_logs,
      (SELECT COUNT(*) FROM raw_logs WHERE device_id = d.id AND status = 'PENDING') AS pending_logs
    FROM devices d
    LEFT JOIN branches b ON b.id = d.branch_id
    WHERE d.id = $1`,
    [id]
  );
  return rows[0];
};

const create = async ({ name, type, serial_number, model, ip_address, port, location, status, api_key, notes, branch_id }) => {
  const { rows } = await pool.query(
    `INSERT INTO devices (name, type, serial_number, model, ip_address, port, location, status, api_key, notes, branch_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [name, type || "BIOMETRIC", serial_number || null, model || null, ip_address || null, port || null, location || null, status || "ACTIVE", api_key || null, notes || null, branch_id || null]
  );
  return rows[0];
};

const update = async (id, { name, type, serial_number, model, ip_address, port, location, status, api_key, notes, branch_id }) => {
  const { rows } = await pool.query(
    `UPDATE devices SET name = $1, type = $2, serial_number = $3, model = $4, ip_address = $5, port = $6,
     location = $7, status = $8, api_key = $9, notes = $10, branch_id = $11, updated_at = NOW()
     WHERE id = $12 RETURNING *`,
    [name, type, serial_number, model, ip_address, port, location, status, api_key, notes, branch_id || null, id]
  );
  return rows[0];
};

const remove = async (id) => {
  await pool.query("DELETE FROM devices WHERE id = $1", [id]);
};

const updateLastConnected = async (id) => {
  await pool.query("UPDATE devices SET last_connected_at = NOW() WHERE id = $1", [id]);
};

const updateApiKeyHash = async (id, hash) => {
  const { rows } = await pool.query(
    `UPDATE devices SET api_key_hash = $1, api_key_created_at = NOW(), updated_at = NOW()
     WHERE id = $2 RETURNING id, name, api_key_created_at`,
    [hash, id]
  );
  return rows[0];
};

const getByDeviceId = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, name, status, api_key_hash
     FROM devices WHERE id = $1`,
    [id]
  );
  return rows[0];
};

module.exports = { getAll, getById, create, update, remove, updateLastConnected, updateApiKeyHash, getByDeviceId };
