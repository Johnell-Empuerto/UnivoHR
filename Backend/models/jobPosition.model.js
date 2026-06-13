const pool = require("../config/db");

const getAll = async (page = 1, limit = 10, search = "", status = "") => {
  const offset = (page - 1) * limit;
  const searchValue = `%${search}%`;

  const dataQuery = await pool.query(
    `SELECT jp.*, b.name AS branch_name, b.code AS branch_code,
            rw.name AS workflow_name
     FROM job_positions jp
     LEFT JOIN branches b ON b.id = jp.branch_id
     LEFT JOIN recruitment_workflows rw ON rw.id = jp.workflow_id
     WHERE ($3 = '' OR jp.title ILIKE $3 OR jp.department ILIKE $3)
       AND ($4 = '' OR jp.status = $4)
     ORDER BY jp.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset, searchValue, status],
  );

  const countQuery = await pool.query(
    `SELECT COUNT(*) FROM job_positions
     WHERE ($1 = '' OR title ILIKE $1 OR department ILIKE $1)
       AND ($2 = '' OR status = $2)`,
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

const getAllActive = async () => {
  const result = await pool.query(
    `SELECT jp.*, b.name AS branch_name, b.code AS branch_code,
            rw.name AS workflow_name
     FROM job_positions jp
     LEFT JOIN branches b ON b.id = jp.branch_id
     LEFT JOIN recruitment_workflows rw ON rw.id = jp.workflow_id
     WHERE jp.status = 'ACTIVE' ORDER BY jp.title ASC`,
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(
    `SELECT jp.*, b.name AS branch_name, b.code AS branch_code,
            rw.name AS workflow_name
     FROM job_positions jp
     LEFT JOIN branches b ON b.id = jp.branch_id
     LEFT JOIN recruitment_workflows rw ON rw.id = jp.workflow_id
     WHERE jp.id = $1`,
    [id],
  );
  return result.rows[0];
};

const create = async (data) => {
  const { title, department, description, requirements, salary_range, status, employment_type, branch_id, workflow_id } = data;
  const result = await pool.query(
    `INSERT INTO job_positions (title, department, description, requirements, salary_range, status, employment_type, branch_id, workflow_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [title, department || null, description || null, requirements || null, salary_range || null, status || 'ACTIVE', employment_type || null, branch_id || null, workflow_id || null],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { title, department, description, requirements, salary_range, status, employment_type, branch_id, workflow_id } = data;
  const result = await pool.query(
    `UPDATE job_positions SET title = $1, department = $2, description = $3, requirements = $4, salary_range = $5, status = $6, employment_type = $7, branch_id = $8, workflow_id = $9, updated_at = NOW()
     WHERE id = $10 RETURNING *`,
    [title, department || null, description || null, requirements || null, salary_range || null, status || 'ACTIVE', employment_type || null, branch_id || null, workflow_id || null, id],
  );
  return result.rows[0];
};

const getByTitle = async (title, excludeId = null) => {
  const result = await pool.query(
    `SELECT id FROM job_positions WHERE LOWER(title) = LOWER($1) AND ($2::int IS NULL OR id != $2) LIMIT 1`,
    [title, excludeId],
  );
  return result.rows[0] || null;
};

const isUsedByApplicants = async (id) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM applicants WHERE job_position_id = $1`,
    [id],
  );
  return parseInt(result.rows[0].count) > 0;
};

const remove = async (id) => {
  const result = await pool.query(`DELETE FROM job_positions WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
};

module.exports = {
  getAll,
  getAllActive,
  getById,
  create,
  update,
  remove,
  getByTitle,
  isUsedByApplicants,
};
