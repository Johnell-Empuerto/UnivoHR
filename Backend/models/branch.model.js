const pool = require("../config/db");

const getAll = async () => {
  const result = await pool.query(
    `SELECT * FROM branches ORDER BY is_active DESC, name ASC`,
  );
  return result.rows;
};

const getActive = async () => {
  const result = await pool.query(
    `SELECT * FROM branches WHERE is_active = true ORDER BY name ASC`,
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(`SELECT * FROM branches WHERE id = $1`, [id]);
  return result.rows[0];
};

const getByCode = async (code) => {
  const result = await pool.query(`SELECT * FROM branches WHERE code = $1`, [
    code,
  ]);
  return result.rows[0];
};

const create = async (data) => {
  const { code, name, address, city, province, phone } = data;
  const result = await pool.query(
    `INSERT INTO branches (code, name, address, city, province, phone)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [code, name, address || null, city || null, province || null, phone || null],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { code, name, address, city, province, phone } = data;
  const result = await pool.query(
    `UPDATE branches
     SET code = $1, name = $2, address = $3, city = $4, province = $5, phone = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [code, name, address || null, city || null, province || null, phone || null, id],
  );
  return result.rows[0];
};

const setActive = async (id, is_active) => {
  const result = await pool.query(
    `UPDATE branches SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [is_active, id],
  );
  return result.rows[0];
};

const countEmployees = async (branch_id) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM employees WHERE branch_id = $1`,
    [branch_id],
  );
  return result.rows[0].count;
};

module.exports = {
  getAll,
  getActive,
  getById,
  getByCode,
  create,
  update,
  setActive,
  countEmployees,
};
