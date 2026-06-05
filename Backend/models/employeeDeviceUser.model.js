const pool = require("../config/db");

const getAll = async ({ page = 1, limit = 50, device_id, active }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (device_id) {
    conditions.push(`u.device_id = $${idx++}`);
    params.push(parseInt(device_id));
  }
  if (active !== undefined && active !== "") {
    conditions.push(`u.active = $${idx++}`);
    params.push(active === "true");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `SELECT COUNT(*) FROM employee_device_users u ${where}`;
  const { rows: [{ count }] } = await pool.query(countQuery, params);

  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT u.*, d.name AS device_name,
           e.employee_code, e.first_name, e.last_name
    FROM employee_device_users u
    LEFT JOIN devices d ON d.id = u.device_id
    LEFT JOIN employees e ON e.id = u.employee_id
    ${where}
    ORDER BY u.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(limit, offset);
  const { rows } = await pool.query(dataQuery, params);

  return { data: rows, pagination: { total: parseInt(count), page, limit, totalPages: Math.ceil(parseInt(count) / limit) } };
};

const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT u.*, d.name AS device_name,
            e.employee_code, e.first_name, e.last_name
     FROM employee_device_users u
     LEFT JOIN devices d ON d.id = u.device_id
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0];
};

const getByDeviceAndUserId = async (device_id, device_user_id) => {
  const { rows } = await pool.query(
    "SELECT * FROM employee_device_users WHERE device_id = $1 AND device_user_id = $2",
    [device_id, device_user_id]
  );
  return rows[0];
};

const create = async ({ employee_id, device_id, device_user_id }) => {
  const { rows } = await pool.query(
    `INSERT INTO employee_device_users (employee_id, device_id, device_user_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [employee_id, device_id, device_user_id]
  );
  return rows[0];
};

const update = async (id, { employee_id, device_id, device_user_id, active }) => {
  const { rows } = await pool.query(
    `UPDATE employee_device_users
     SET employee_id = $1, device_id = $2, device_user_id = $3, active = $4
     WHERE id = $5 RETURNING *`,
    [employee_id, device_id, device_user_id, active, id]
  );
  return rows[0];
};

const remove = async (id) => {
  await pool.query("DELETE FROM employee_device_users WHERE id = $1", [id]);
};

module.exports = { getAll, getById, getByDeviceAndUserId, create, update, remove };
