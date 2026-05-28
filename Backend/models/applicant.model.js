const pool = require("../config/db");

const getAll = async (page = 1, limit = 10, search = "", status = "", jobPositionId = "") => {
  const offset = (page - 1) * limit;
  const searchValue = `%${search}%`;

  const dataQuery = await pool.query(
    `SELECT a.*, jp.title AS job_title, jp.department AS job_department
     FROM applicants a
     LEFT JOIN job_positions jp ON jp.id = a.job_position_id
     WHERE ($3 = '' OR a.first_name ILIKE $3 OR a.last_name ILIKE $3 OR a.email ILIKE $3)
       AND ($4 = '' OR a.status = $4)
       AND ($5 = '' OR a.job_position_id = $5::int)
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset, searchValue, status, jobPositionId],
  );

  const countQuery = await pool.query(
    `SELECT COUNT(*) FROM applicants a
     WHERE ($1 = '' OR a.first_name ILIKE $1 OR a.last_name ILIKE $1 OR a.email ILIKE $1)
       AND ($2 = '' OR a.status = $2)
       AND ($3 = '' OR a.job_position_id = $3::int)`,
    [searchValue, status, jobPositionId],
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
    `SELECT a.*, jp.title AS job_title, jp.department AS job_department
     FROM applicants a
     LEFT JOIN job_positions jp ON jp.id = a.job_position_id
     WHERE a.id = $1`,
    [id],
  );
  return result.rows[0];
};

const create = async (data) => {
  const { job_position_id, first_name, middle_name, last_name, suffix, email, phone, address, resume_url, status, rating, source, notes, applied_date } = data;
  const result = await pool.query(
    `INSERT INTO applicants (job_position_id, first_name, middle_name, last_name, suffix, email, phone, address, resume_url, status, rating, source, notes, applied_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [job_position_id || null, first_name, middle_name || null, last_name, suffix || null, email || null, phone || null, address || null, resume_url || null, status || 'Initial', rating ? Math.min(9.99, parseFloat(rating)) : null, source || null, notes || null, applied_date || new Date().toISOString().split('T')[0]],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { job_position_id, first_name, middle_name, last_name, suffix, email, phone, address, resume_url, status, rating, source, notes, applied_date } = data;
  const result = await pool.query(
    `UPDATE applicants SET job_position_id = $1, first_name = $2, middle_name = $3, last_name = $4, suffix = $5, email = $6, phone = $7, address = $8, resume_url = $9, status = $10, rating = $11, source = $12, notes = $13, applied_date = $14, updated_at = NOW()
     WHERE id = $15 RETURNING *`,
    [job_position_id || null, first_name, middle_name || null, last_name, suffix || null, email || null, phone || null, address || null, resume_url || null, status || 'Initial', rating ? Math.min(9.99, parseFloat(rating)) : null, source || null, notes || null, applied_date || null, id],
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(`DELETE FROM applicants WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
};

const updateEmployeeId = async (id, employeeId) => {
  const result = await pool.query(
    `UPDATE applicants SET employee_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [employeeId, id],
  );
  return result.rows[0];
};

const updateStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE applicants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id],
  );
  return result.rows[0];
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  remove,
  updateEmployeeId,
};
