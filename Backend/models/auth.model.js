const pool = require("../config/db");

const findUserByUsername = async (username) => {
  const result = await pool.query(
    `
  SELECT 
    u.id,
    u.username,
    u.password_hash,
    u.role,
    u.employee_id,
    e.first_name,
    e.last_name,
    e.middle_name,
    e.suffix,
    e.employee_code,
    e.email 
  FROM users u
  LEFT JOIN employees e ON e.id = u.employee_id
  WHERE u.username = $1
`,
    [username],
  );

  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query(
    `
  SELECT 
    u.id,
    u.username,
    u.password_hash,
    u.role,
    u.employee_id,
    e.first_name,
    e.last_name,
    e.middle_name,
    e.suffix,
    e.employee_code,
    e.email  
  FROM users u
  LEFT JOIN employees e ON e.id = u.employee_id
  WHERE u.id = $1
`,
    [id],
  );

  return result.rows[0];
};

module.exports = {
  findUserByUsername,
  findUserById,
};
