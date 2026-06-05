const pool = require("../config/db");

const getByDevice = async (deviceId) => {
  const { rows } = await pool.query(
    "SELECT * FROM device_log_mappings WHERE device_id = $1 ORDER BY field_target ASC",
    [deviceId]
  );
  return rows;
};

const getAll = async () => {
  const { rows } = await pool.query(
    `SELECT m.*, d.name AS device_name FROM device_log_mappings m LEFT JOIN devices d ON d.id = m.device_id ORDER BY m.device_id, m.field_target`
  );
  return rows;
};

const create = async ({ device_id, field_source, field_target, transform_expression }) => {
  const { rows } = await pool.query(
    `INSERT INTO device_log_mappings (device_id, field_source, field_target, transform_expression) VALUES ($1, $2, $3, $4) RETURNING *`,
    [device_id, field_source, field_target, transform_expression || null]
  );
  return rows[0];
};

const update = async (id, { field_source, field_target, transform_expression, is_active }) => {
  const { rows } = await pool.query(
    `UPDATE device_log_mappings SET field_source = $1, field_target = $2, transform_expression = $3, is_active = $4 WHERE id = $5 RETURNING *`,
    [field_source, field_target, transform_expression || null, is_active, id]
  );
  return rows[0];
};

const remove = async (id) => {
  await pool.query("DELETE FROM device_log_mappings WHERE id = $1", [id]);
};

const removeByDevice = async (deviceId) => {
  await pool.query("DELETE FROM device_log_mappings WHERE device_id = $1", [deviceId]);
};

module.exports = { getByDevice, getAll, create, update, remove, removeByDevice };
