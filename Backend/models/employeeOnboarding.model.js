const pool = require("../config/db");

const getAll = async (page = 1, limit = 10, search = "", status = "") => {
  const offset = (page - 1) * limit;
  const searchValue = `%${search}%`;

  const dataQuery = await pool.query(
    `SELECT eo.*, e.first_name, e.last_name, e.employee_code, e.department, e.position
     FROM employee_onboarding eo
     JOIN employees e ON e.id = eo.employee_id
     WHERE ($3 = '' OR e.first_name ILIKE $3 OR e.last_name ILIKE $3 OR e.employee_code ILIKE $3)
       AND ($4 = '' OR eo.status = $4)
     ORDER BY eo.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset, searchValue, status],
  );

  const countQuery = await pool.query(
    `SELECT COUNT(*) FROM employee_onboarding eo
     JOIN employees e ON e.id = eo.employee_id
     WHERE ($1 = '' OR e.first_name ILIKE $1 OR e.last_name ILIKE $1 OR e.employee_code ILIKE $1)
       AND ($2 = '' OR eo.status = $2)`,
    [searchValue, status],
  );

  return {
    data: dataQuery.rows,
    pagination: {
      total: parseInt(countQuery.rows[0].count),
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(parseInt(countQuery.rows[0].count) / limit),
    },
  };
};

const getById = async (id) => {
  const result = await pool.query(
    `SELECT eo.*, e.first_name, e.last_name, e.middle_name, e.suffix, e.employee_code, e.department, e.position, e.email, e.phone, e.hired_date
     FROM employee_onboarding eo
     JOIN employees e ON e.id = eo.employee_id
     WHERE eo.id = $1`,
    [id],
  );
  return result.rows[0];
};

const getByEmployeeId = async (employeeId) => {
  const result = await pool.query(
    `SELECT * FROM employee_onboarding WHERE employee_id = $1 ORDER BY created_at DESC`,
    [employeeId],
  );
  return result.rows[0];
};

const create = async (data) => {
  const { employee_id, applicant_id, onboarding_date, status, notes } = data;
  const result = await pool.query(
    `INSERT INTO employee_onboarding (employee_id, applicant_id, onboarding_date, status, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [employee_id, applicant_id || null, onboarding_date || null, status || 'PENDING', notes || null],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { onboarding_date, status, notes } = data;
  const result = await pool.query(
    `UPDATE employee_onboarding SET onboarding_date = $1, status = $2, notes = $3, updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [onboarding_date || null, status || 'PENDING', notes || null, id],
  );
  return result.rows[0];
};

module.exports = {
  getAll,
  getById,
  getByEmployeeId,
  create,
  update,
};
