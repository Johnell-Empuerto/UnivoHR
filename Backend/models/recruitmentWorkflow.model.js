const pool = require("../config/db");

const getAll = async ({ search = "", is_active = "", branch_id = "", job_position_id = "", page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const searchValue = `%${search}%`;

  const dataQuery = await pool.query(
    `SELECT rw.*, b.name AS branch_name, b.code AS branch_code, jp.title AS job_position_title
     FROM recruitment_workflows rw
     LEFT JOIN branches b ON b.id = rw.branch_id
     LEFT JOIN job_positions jp ON jp.id = rw.job_position_id
     WHERE ($3 = '' OR rw.name ILIKE $3)
       AND ($4 = '' OR rw.is_active = $4::boolean)
       AND ($5 = '' OR rw.branch_id = $5::int)
       AND ($6 = '' OR rw.job_position_id = $6::int)
     ORDER BY rw.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset, searchValue, is_active, branch_id, job_position_id],
  );

  const countQuery = await pool.query(
    `SELECT COUNT(*) FROM recruitment_workflows rw
     WHERE ($1 = '' OR rw.name ILIKE $1)
       AND ($2 = '' OR rw.is_active = $2::boolean)
       AND ($3 = '' OR rw.branch_id = $3::int)
       AND ($4 = '' OR rw.job_position_id = $4::int)`,
    [searchValue, is_active, branch_id, job_position_id],
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

const getByName = async (name, excludeId = null) => {
  const result = await pool.query(
    `SELECT * FROM recruitment_workflows WHERE LOWER(name) = LOWER($1) AND ($2::int IS NULL OR id != $2)`,
    [name, excludeId],
  );
  return result.rows[0];
};

const getAllSimple = async () => {
  const result = await pool.query(
    `SELECT id, name, description, is_default, is_active, version
     FROM recruitment_workflows
     ORDER BY name ASC`,
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(
    `SELECT rw.*, b.name AS branch_name, b.code AS branch_code, jp.title AS job_position_title
     FROM recruitment_workflows rw
     LEFT JOIN branches b ON b.id = rw.branch_id
     LEFT JOIN job_positions jp ON jp.id = rw.job_position_id
     WHERE rw.id = $1`,
    [id],
  );
  return result.rows[0];
};

const create = async (data) => {
  const { name, description, branch_id, job_position_id, is_default, is_active, version } = data;
  const result = await pool.query(
    `INSERT INTO recruitment_workflows (name, description, branch_id, job_position_id, is_default, is_active, version)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, description || null, branch_id || null, job_position_id || null, is_default || false, is_active !== undefined ? is_active : true, version || 1],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { name, description, branch_id, job_position_id, is_default, is_active, version } = data;
  const result = await pool.query(
    `UPDATE recruitment_workflows SET name = $1, description = $2, branch_id = $3, job_position_id = $4, is_default = $5, is_active = $6, version = $7, updated_at = NOW()
     WHERE id = $8 RETURNING *`,
    [name, description || null, branch_id || null, job_position_id || null, is_default !== undefined ? is_default : false, is_active !== undefined ? is_active : true, version || 1, id],
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(`DELETE FROM recruitment_workflows WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
};

const getStages = async (workflowId) => {
  const result = await pool.query(
    `SELECT * FROM recruitment_workflow_stages
     WHERE workflow_id = $1
     ORDER BY sequence_order ASC`,
    [workflowId],
  );
  return result.rows;
};

const createStage = async (workflowId, data) => {
  const { stage_name, stage_type, stage_category, sequence_order, is_required, requires_assignment, requires_score, requires_approval, passing_score, next_stage_on_pass, next_stage_on_fail, allow_skip, auto_proceed_on_pass, days_to_complete, is_terminal } = data;
  const result = await pool.query(
    `INSERT INTO recruitment_workflow_stages (workflow_id, stage_name, stage_type, stage_category, sequence_order, is_required, requires_assignment, requires_score, requires_approval, passing_score, next_stage_on_pass, next_stage_on_fail, allow_skip, auto_proceed_on_pass, days_to_complete, is_terminal)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
    [workflowId, stage_name, stage_type, stage_category || null, sequence_order, is_required !== undefined ? is_required : true, requires_assignment || false, requires_score || false, requires_approval || false, passing_score || null, next_stage_on_pass || null, next_stage_on_fail || null, allow_skip || false, auto_proceed_on_pass || false, days_to_complete || null, is_terminal || false],
  );
  return result.rows[0];
};

const updateStage = async (stageId, data) => {
  const { stage_name, stage_type, stage_category, sequence_order, is_required, requires_assignment, requires_score, requires_approval, passing_score, next_stage_on_pass, next_stage_on_fail, allow_skip, auto_proceed_on_pass, days_to_complete, is_terminal } = data;
  const result = await pool.query(
    `UPDATE recruitment_workflow_stages SET stage_name = $1, stage_type = $2, stage_category = $3, sequence_order = $4, is_required = $5, requires_assignment = $6, requires_score = $7, requires_approval = $8, passing_score = $9, next_stage_on_pass = $10, next_stage_on_fail = $11, allow_skip = $12, auto_proceed_on_pass = $13, days_to_complete = $14, is_terminal = $15, updated_at = NOW()
     WHERE id = $16 RETURNING *`,
    [stage_name, stage_type, stage_category || null, sequence_order, is_required !== undefined ? is_required : true, requires_assignment || false, requires_score || false, requires_approval || false, passing_score || null, next_stage_on_pass || null, next_stage_on_fail || null, allow_skip || false, auto_proceed_on_pass || false, days_to_complete || null, is_terminal || false, stageId],
  );
  return result.rows[0];
};

const deleteStage = async (stageId) => {
  const result = await pool.query(`DELETE FROM recruitment_workflow_stages WHERE id = $1 RETURNING *`, [stageId]);
  return result.rows[0];
};

const getStageById = async (stageId) => {
  const result = await pool.query(`SELECT * FROM recruitment_workflow_stages WHERE id = $1`, [stageId]);
  return result.rows[0];
};

module.exports = {
  getAll,
  getAllSimple,
  getByName,
  getById,
  create,
  update,
  remove,
  getStages,
  createStage,
  updateStage,
  deleteStage,
  getStageById,
};
