const pool = require("../config/db");

const createEvaluation = async (data) => {
  const result = await pool.query(
    `INSERT INTO employee_kpi_evaluations
     (employee_id, evaluator_id, template_id, evaluation_period_start, evaluation_period_end, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [data.employee_id, data.evaluator_id, data.template_id,
     data.evaluation_period_start || null, data.evaluation_period_end || null,
     data.created_by || null],
  );
  return result.rows[0];
};

const getEvaluationById = async (id) => {
  const result = await pool.query(
    `SELECT eke.*,
            emp.first_name || ' ' || emp.last_name AS employee_name,
            emp.employee_code AS employee_code,
            ev.first_name || ' ' || ev.last_name AS evaluator_name,
            kt.name AS template_name
     FROM employee_kpi_evaluations eke
     JOIN employees emp ON emp.id = eke.employee_id
     JOIN employees ev ON ev.id = eke.evaluator_id
     JOIN kpi_templates kt ON kt.id = eke.template_id
     WHERE eke.id = $1`,
    [id],
  );
  return result.rows[0];
};

const getEvaluationsByEmployee = async (employeeId, status = "", page, limit) => {
  const hasPagination = page !== undefined && limit !== undefined;
  if (hasPagination) {
    const offset = (page - 1) * limit;
    let query = `SELECT eke.*, kt.name AS template_name
                 FROM employee_kpi_evaluations eke
                 JOIN kpi_templates kt ON kt.id = eke.template_id
                 WHERE eke.employee_id = $1`;
    const params = [employeeId];
    let idx = 2;
    if (status) {
      query += ` AND eke.status = $${idx}`;
      params.push(status);
      idx++;
    }
    query += ` ORDER BY eke.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limit, offset);
    const data = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) FROM employee_kpi_evaluations WHERE employee_id = $1`;
    const countParams = [employeeId];
    if (status) {
      countQuery += ` AND status = $2`;
      countParams.push(status);
    }
    const count = await pool.query(countQuery, countParams);
    const total = parseInt(count.rows[0].count);
    return { data: data.rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
  }

  // Backward-compatible: no pagination
  let query = `SELECT eke.*, kt.name AS template_name
               FROM employee_kpi_evaluations eke
               JOIN kpi_templates kt ON kt.id = eke.template_id
               WHERE eke.employee_id = $1`;
  const params = [employeeId];
  if (status) {
    query += ` AND eke.status = $2`;
    params.push(status);
  }
  query += ` ORDER BY eke.created_at DESC`;
  const result = await pool.query(query, params);
  return result.rows;
};

const getEvaluationsByEvaluator = async (evaluatorId, status = "", page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const params = [evaluatorId];
  let where = `WHERE eke.evaluator_id = $1`;
  if (status) {
    where += ` AND eke.status = $2`;
    params.push(status);
  }
  const data = await pool.query(
    `SELECT eke.*, emp.first_name || ' ' || emp.last_name AS employee_name,
            emp.employee_code AS employee_code, kt.name AS template_name
     FROM employee_kpi_evaluations eke
     JOIN employees emp ON emp.id = eke.employee_id
     JOIN kpi_templates kt ON kt.id = eke.template_id
     ${where} ORDER BY eke.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*) FROM employee_kpi_evaluations eke ${where}`, params,
  );
  const total = parseInt(count.rows[0].count);
  return { data: data.rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
};

const getEvaluationsForHr = async (search = "", status = "", page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  let where = `WHERE 1=1`;
  const params = [];
  let idx = 1;
  if (status) {
    where += ` AND eke.status = $${idx++}`;
    params.push(status);
  }
  if (search) {
    where += ` AND (emp.first_name ILIKE $${idx} OR emp.last_name ILIKE $${idx} OR emp.employee_code ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }
  const data = await pool.query(
    `SELECT eke.*, emp.first_name || ' ' || emp.last_name AS employee_name,
            emp.employee_code AS employee_code,
            ev.first_name || ' ' || ev.last_name AS evaluator_name,
            kt.name AS template_name
     FROM employee_kpi_evaluations eke
     JOIN employees emp ON emp.id = eke.employee_id
     JOIN employees ev ON ev.id = eke.evaluator_id
     JOIN kpi_templates kt ON kt.id = eke.template_id
     ${where} ORDER BY eke.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*) FROM employee_kpi_evaluations eke
     JOIN employees emp ON emp.id = eke.employee_id ${where}`, params,
  );
  const total = parseInt(count.rows[0].count);
  return { data: data.rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
};

const updateEvaluation = async (id, data) => {
  const sets = [];
  const params = [];
  let idx = 1;
  for (const [key, value] of Object.entries(data)) {
    sets.push(`${key} = $${idx++}`);
    params.push(value);
  }
  params.push(id);
  const result = await pool.query(
    `UPDATE employee_kpi_evaluations SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0];
};

const getScoresByEvaluationId = async (evaluationId) => {
  const result = await pool.query(
    `SELECT ekes.*, kti.kpi_name, kti.weight
     FROM employee_kpi_scores ekes
     JOIN kpi_template_items kti ON kti.id = ekes.template_item_id
     WHERE ekes.evaluation_id = $1 ORDER BY kti.id`,
    [evaluationId],
  );
  return result.rows;
};

const upsertScore = async (data) => {
  const existing = await pool.query(
    `SELECT id FROM employee_kpi_scores WHERE evaluation_id = $1 AND template_item_id = $2`,
    [data.evaluation_id, data.template_item_id],
  );
  if (existing.rows.length > 0) {
    const result = await pool.query(
      `UPDATE employee_kpi_scores SET manager_score=$1, weighted_score=$2, remarks=$3, updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [data.manager_score, data.weighted_score, data.remarks || null, existing.rows[0].id],
    );
    return result.rows[0];
  }
  const result = await pool.query(
    `INSERT INTO employee_kpi_scores (evaluation_id, template_item_id, manager_score, weighted_score, remarks)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [data.evaluation_id, data.template_item_id, data.manager_score, data.weighted_score, data.remarks || null],
  );
  return result.rows[0];
};

const deleteScoresByEvaluationId = async (evaluationId) => {
  await pool.query(`DELETE FROM employee_kpi_scores WHERE evaluation_id = $1`, [evaluationId]);
};

const getPendingCountByEvaluator = async (evaluatorId) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM employee_kpi_evaluations WHERE evaluator_id = $1 AND status = 'Draft'`,
    [evaluatorId],
  );
  return parseInt(result.rows[0].count);
};

const checkExistingEvaluation = async (employeeId, templateId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT id FROM employee_kpi_evaluations
     WHERE employee_id = $1 AND template_id = $2
       AND evaluation_period_start = $3 AND evaluation_period_end = $4
       AND status != 'Completed' AND status != 'Approved'`,
    [employeeId, templateId, startDate, endDate],
  );
  return result.rows[0] || null;
};

const bulkCreateEvaluations = async (evaluations, createdBy) => {
  const skippedEmployeeIds = [];
  const createdIds = [];
  for (const ev of evaluations) {
    const existing = await checkExistingEvaluation(
      ev.employee_id, ev.template_id, ev.evaluation_period_start, ev.evaluation_period_end,
    );
    if (existing) {
      skippedEmployeeIds.push(ev.employee_id);
      continue;
    }
    const result = await pool.query(
      `INSERT INTO employee_kpi_evaluations
       (employee_id, evaluator_id, template_id, evaluation_period_start, evaluation_period_end, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [ev.employee_id, ev.evaluator_id, ev.template_id,
       ev.evaluation_period_start || null, ev.evaluation_period_end || null,
       createdBy || null],
    );
    createdIds.push(result.rows[0].id);
  }
  return { created_count: createdIds.length, skipped_count: skippedEmployeeIds.length, skipped_employee_ids: skippedEmployeeIds };
};

module.exports = {
  createEvaluation, getEvaluationById,
  getEvaluationsByEmployee, getEvaluationsByEvaluator, getEvaluationsForHr,
  updateEvaluation,
  getScoresByEvaluationId, upsertScore, deleteScoresByEvaluationId,
  getPendingCountByEvaluator, checkExistingEvaluation,
};
