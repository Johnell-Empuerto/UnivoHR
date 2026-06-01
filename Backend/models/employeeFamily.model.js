const pool = require("../config/db");

const getAllByEmployeeId = async (employeeId) => {
  const result = await pool.query(
    "SELECT * FROM employee_family_members WHERE employee_id = $1 ORDER BY created_at DESC",
    [employeeId],
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query("SELECT * FROM employee_family_members WHERE id = $1", [id]);
  return result.rows[0];
};

const create = async (data) => {
  const result = await pool.query(
    `INSERT INTO employee_family_members
     (employee_id, relationship_type, full_name, birthdate, occupation, contact_number, address, is_dependent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.employee_id, data.relationship_type, data.full_name,
     data.birthdate || null, data.occupation || null, data.contact_number || null,
     data.address || null, data.is_dependent || false],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const result = await pool.query(
    `UPDATE employee_family_members SET
      relationship_type = $1, full_name = $2, birthdate = $3,
      occupation = $4, contact_number = $5, address = $6,
      is_dependent = $7, updated_at = NOW()
     WHERE id = $8 RETURNING *`,
    [data.relationship_type, data.full_name, data.birthdate || null,
     data.occupation || null, data.contact_number || null, data.address || null,
     data.is_dependent || false, id],
  );
  return result.rows[0];
};

const remove = async (id) => {
  await pool.query("DELETE FROM employee_family_members WHERE id = $1", [id]);
};

module.exports = { getAllByEmployeeId, getById, create, update, remove };
