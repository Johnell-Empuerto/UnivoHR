const pool = require("../config/db");

const getPerformanceSummary = async (employeeId) => {
  const result = await pool.query(
    `SELECT
       (SELECT final_score FROM employee_kpi_evaluations
        WHERE employee_id = $1 AND status = 'Approved'
        ORDER BY created_at DESC LIMIT 1) AS latest_score,
       (SELECT ROUND(AVG(final_score), 2) FROM employee_kpi_evaluations
        WHERE employee_id = $1 AND status = 'Approved') AS average_score,
       (SELECT COUNT(*) FROM employee_kpi_evaluations
        WHERE employee_id = $1 AND status = 'Approved') AS completed_count,
       (SELECT COUNT(*) FROM employee_kpi_evaluations
        WHERE employee_id = $1 AND status NOT IN ('Approved', 'Completed')) AS pending_count,
       (SELECT employment_status FROM employees WHERE id = $1) AS employment_status`,
    [employeeId],
  );
  return result.rows[0];
};

const getLatestEvaluation = async (employeeId) => {
  const result = await pool.query(
    `SELECT eke.final_score, eke.recommendation,
            eke.evaluation_period_start, eke.evaluation_period_end,
            eke.manager_comments, eke.hr_comments,
            ev.first_name || ' ' || ev.last_name AS evaluator_name,
            kt.name AS template_name
     FROM employee_kpi_evaluations eke
     LEFT JOIN employees ev ON ev.id = eke.evaluator_id
     JOIN kpi_templates kt ON kt.id = eke.template_id
     WHERE eke.employee_id = $1 AND eke.status = 'Approved'
     ORDER BY eke.created_at DESC LIMIT 1`,
    [employeeId],
  );
  return result.rows[0] || null;
};

module.exports = { getPerformanceSummary, getLatestEvaluation };
