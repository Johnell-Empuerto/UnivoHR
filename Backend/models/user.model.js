const pool = require("../config/db");

// GET ALL USERS WITH PAGINATION AND FILTERS
const getUsers = async (page = 1, limit = 10, search = "", role = "") => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT 
      u.id,
      u.username,
      u.role,
      u.employee_id,
      u.created_at,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      e.department,
      e.position
    FROM users u
    JOIN employees e ON e.id = u.employee_id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (
      u.username ILIKE $${paramIndex} OR 
      e.first_name ILIKE $${paramIndex} OR 
      e.last_name ILIKE $${paramIndex} OR 
      e.employee_code ILIKE $${paramIndex}
    )`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (role) {
    query += ` AND u.role = $${paramIndex}`;
    params.push(role);
    paramIndex++;
  }

  query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count for pagination
  let countQuery = `
    SELECT COUNT(*) 
    FROM users u
    JOIN employees e ON e.id = u.employee_id
    WHERE 1=1
  `;
  const countParams = [];
  let countIndex = 1;

  if (search) {
    countQuery += ` AND (
      u.username ILIKE $${countIndex} OR 
      e.first_name ILIKE $${countIndex} OR 
      e.last_name ILIKE $${countIndex} OR 
      e.employee_code ILIKE $${countIndex}
    )`;
    countParams.push(`%${search}%`);
    countIndex++;
  }

  if (role) {
    countQuery += ` AND u.role = $${countIndex}`;
    countParams.push(role);
  }

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  return {
    data: result.rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// GET USER BY ID
const getUserById = async (id) => {
  const result = await pool.query(
    `SELECT 
      u.id,
      u.username,
      u.role,
      u.employee_id,
      u.created_at,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      e.department,
      e.position,
      e.status as employee_status
    FROM users u
    JOIN employees e ON e.id = u.employee_id
    WHERE u.id = $1`,
    [id],
  );
  return result.rows[0];
};

// CREATE USER
const createUser = async (data) => {
  const { username, password_hash, role, employee_id } = data;

  const result = await pool.query(
    `INSERT INTO users (username, password_hash, role, employee_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, role, employee_id, created_at`,
    [username, password_hash, role, employee_id],
  );
  return result.rows[0];
};

// UPDATE USER
const updateUser = async (id, data) => {
  const { username, role, password_hash } = data;

  let query = `UPDATE users SET username = $1, role = $2`;
  const params = [username, role];
  let paramIndex = 3;

  if (password_hash) {
    query += `, password_hash = $${paramIndex}`;
    params.push(password_hash);
    paramIndex++;
  }

  query += ` WHERE id = $${paramIndex} RETURNING id, username, role, employee_id`;
  params.push(id);

  const result = await pool.query(query, params);
  return result.rows[0];
};

// DELETE USER
const deleteUser = async (id) => {
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [id],
  );
  return result.rows[0];
};

// CHECK IF USERNAME EXISTS
const usernameExists = async (username, excludeId = null) => {
  let query = `SELECT id FROM users WHERE username = $1`;
  const params = [username];

  if (excludeId) {
    query += ` AND id != $2`;
    params.push(excludeId);
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

// GET EMPLOYEES WITHOUT USER ACCOUNTS
const getEmployeesWithoutAccounts = async () => {
  const result = await pool.query(`
    SELECT 
      e.id,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      e.department,
      e.position
    FROM employees e
    LEFT JOIN users u ON u.employee_id = e.id
    WHERE u.id IS NULL
      AND e.status = 'ACTIVE'
    ORDER BY e.first_name, e.last_name
  `);
  return result.rows;
};

// GET EMPLOYEE NAME BY ID
const getEmployeeName = async (employeeId) => {
  const result = await pool.query(
    `SELECT first_name, last_name, middle_name, suffix, employee_code
     FROM employees WHERE id = $1`,
    [employeeId],
  );
  return result.rows[0];
};

// FIND USER BY EMAIL
const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT
      u.id,
      u.username,
      u.password_hash,
      u.role,
      u.employee_id,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.email,
      e.employee_code
     FROM users u
     JOIN employees e ON e.id = u.employee_id
     WHERE LOWER(e.email) = LOWER($1)`,
    [email],
  );
  return result.rows[0];
};

// UPDATE PASSWORD
const updatePassword = async (userId, newPasswordHash) => {
  const result = await pool.query(
    `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id`,
    [newPasswordHash, userId],
  );
  return result.rows[0];
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  usernameExists,
  getEmployeesWithoutAccounts,
  getEmployeeName,
  findUserByEmail,
  updatePassword,
};
