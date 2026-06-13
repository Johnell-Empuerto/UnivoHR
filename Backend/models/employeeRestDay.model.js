const pool = require("../config/db");

const getByEmployeeId = async (employeeId) => {
  const result = await pool.query(
    `SELECT * FROM employee_rest_days
     WHERE employee_id = $1
       AND (end_date IS NULL OR end_date >= CURRENT_DATE)
     ORDER BY day_of_week`,
    [employeeId]
  );
  return result.rows;
};

const getByEmployeeIds = async (employeeIds) => {
  if (!employeeIds || employeeIds.length === 0) return [];
  const result = await pool.query(
    `SELECT * FROM employee_rest_days
     WHERE employee_id = ANY($1::int[])
       AND (end_date IS NULL OR end_date >= CURRENT_DATE)
     ORDER BY employee_id, day_of_week`,
    [employeeIds]
  );
  return result.rows;
};

const create = async (data) => {
  const { employee_id, day_of_week, effective_date, end_date } = data;
  const result = await pool.query(
    `INSERT INTO employee_rest_days (employee_id, day_of_week, effective_date, end_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [employee_id, day_of_week, effective_date || new Date(), end_date || null]
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { day_of_week, effective_date, end_date } = data;
  const result = await pool.query(
    `UPDATE employee_rest_days
     SET day_of_week = COALESCE($1, day_of_week),
         effective_date = COALESCE($2, effective_date),
         end_date = COALESCE($3, end_date),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [day_of_week, effective_date, end_date || null, id]
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(
    `DELETE FROM employee_rest_days WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

const removeByEmployeeId = async (employeeId) => {
  const result = await pool.query(
    `DELETE FROM employee_rest_days WHERE employee_id = $1 RETURNING *`,
    [employeeId]
  );
  return result.rows;
};

module.exports = {
  getByEmployeeId,
  getByEmployeeIds,
  create,
  update,
  remove,
  removeByEmployeeId,
};
