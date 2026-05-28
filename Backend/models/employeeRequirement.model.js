const pool = require("../config/db");

const getByOnboardingId = async (onboardingId) => {
  const result = await pool.query(
    `SELECT * FROM employee_requirements WHERE onboarding_id = $1 ORDER BY created_at ASC`,
    [onboardingId],
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(`SELECT * FROM employee_requirements WHERE id = $1`, [id]);
  return result.rows[0];
};

const create = async (data) => {
  const { onboarding_id, requirement_name, description } = data;
  const result = await pool.query(
    `INSERT INTO employee_requirements (onboarding_id, requirement_name, description)
     VALUES ($1, $2, $3) RETURNING *`,
    [onboarding_id, requirement_name, description || null],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { requirement_name, description, status, submitted_at, verified_at, file_url } = data;
  const result = await pool.query(
    `UPDATE employee_requirements SET requirement_name = $1, description = $2, status = $3, submitted_at = $4, verified_at = $5, file_url = $6, updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [requirement_name, description || null, status || 'PENDING', submitted_at || null, verified_at || null, file_url || null, id],
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(`DELETE FROM employee_requirements WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
};

module.exports = {
  getByOnboardingId,
  getById,
  create,
  update,
  remove,
};
