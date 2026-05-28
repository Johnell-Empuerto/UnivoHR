const pool = require("../config/db");

const getByApplicantId = async (applicantId) => {
  const result = await pool.query(
    `SELECT aa.*, e.first_name AS approver_first_name, e.last_name AS approver_last_name
     FROM applicant_approvals aa
     LEFT JOIN employees e ON e.id = aa.approved_by
     WHERE aa.applicant_id = $1
     ORDER BY aa.created_at DESC`,
    [applicantId],
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(
    `SELECT aa.*, e.first_name AS approver_first_name, e.last_name AS approver_last_name
     FROM applicant_approvals aa
     LEFT JOIN employees e ON e.id = aa.approved_by
     WHERE aa.id = $1`,
    [id],
  );
  return result.rows[0];
};

const create = async (data) => {
  const { applicant_id, approved_by, approval_type, decision, comments } = data;
  const result = await pool.query(
    `INSERT INTO applicant_approvals (applicant_id, approved_by, approval_type, decision, comments)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [applicant_id, approved_by || null, approval_type, decision || 'PENDING', comments || null],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { approved_by, approval_type, decision, comments, decided_at } = data;
  const result = await pool.query(
    `UPDATE applicant_approvals SET approved_by = $1, approval_type = $2, decision = $3, comments = $4, decided_at = $5, updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [approved_by || null, approval_type, decision || 'PENDING', comments || null, decided_at || null, id],
  );
  return result.rows[0];
};

module.exports = {
  getByApplicantId,
  getById,
  create,
  update,
};
