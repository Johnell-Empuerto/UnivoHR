const pool = require("../config/db");

const validateRating = (rating) => {
  if (rating === null || rating === undefined || rating === "") return null;
  const parsed = parseFloat(rating);
  if (isNaN(parsed) || parsed < 0 || parsed > 10) return null;
  return parsed;
};

const interviewColumns = `
  ai.*,
  u.id AS interviewer_user_id,
  u.username AS interviewer_username,
  u.employee_id AS interviewer_employee_id,
  e.first_name || ' ' || e.last_name AS interviewer_name,
  e.employee_code AS interviewer_employee_code,
  a.first_name AS applicant_first_name,
  a.middle_name AS applicant_middle_name,
  a.last_name AS applicant_last_name,
  a.status AS applicant_status,
  jp.title AS position_title,
  jp.department AS position_department
`;

const getByApplicantId = async (applicantId) => {
  const result = await pool.query(
    `SELECT ${interviewColumns}
     FROM applicant_interviews ai
     LEFT JOIN users u ON u.id = ai.interviewer_user_id
     LEFT JOIN employees e ON e.id = u.employee_id
     LEFT JOIN applicants a ON a.id = ai.applicant_id
     LEFT JOIN job_positions jp ON jp.id = a.job_position_id
     WHERE ai.applicant_id = $1
     ORDER BY ai.interview_date DESC`,
    [applicantId],
  );
  return result.rows;
};

const getByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT ${interviewColumns}
     FROM applicant_interviews ai
     LEFT JOIN users u ON u.id = ai.interviewer_user_id
     LEFT JOIN employees e ON e.id = u.employee_id
     LEFT JOIN applicants a ON a.id = ai.applicant_id
     LEFT JOIN job_positions jp ON jp.id = a.job_position_id
     WHERE ai.interviewer_user_id = $1
     ORDER BY ai.interview_date DESC`,
    [userId],
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(
    `SELECT ${interviewColumns}
     FROM applicant_interviews ai
     LEFT JOIN users u ON u.id = ai.interviewer_user_id
     LEFT JOIN employees e ON e.id = u.employee_id
     LEFT JOIN applicants a ON a.id = ai.applicant_id
     LEFT JOIN job_positions jp ON jp.id = a.job_position_id
     WHERE ai.id = $1`,
    [id],
  );
  return result.rows[0];
};

const create = async (data) => {
  const { applicant_id, interview_date, interviewer, interview_type, notes, rating, status, interviewer_user_id, recommendation } = data;
  const result = await pool.query(
    `INSERT INTO applicant_interviews (applicant_id, interview_date, interviewer, interview_type, notes, rating, status, interviewer_user_id, recommendation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [applicant_id, interview_date, interviewer || null, interview_type || null, notes || null, validateRating(rating), status || 'SCHEDULED', interviewer_user_id || null, recommendation || null],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { interview_date, interviewer, interview_type, notes, rating, status, interviewer_user_id, recommendation } = data;
  const result = await pool.query(
    `UPDATE applicant_interviews SET interview_date = $1, interviewer = $2, interview_type = $3, notes = $4, rating = $5, status = $6, interviewer_user_id = $7, recommendation = $8, updated_at = NOW()
     WHERE id = $9 RETURNING *`,
    [interview_date, interviewer || null, interview_type || null, notes || null, validateRating(rating), status || 'SCHEDULED', interviewer_user_id || null, recommendation || null, id],
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(`DELETE FROM applicant_interviews WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
};

const getPossibleInterviewers = async () => {
  const result = await pool.query(
    `SELECT u.id AS user_id, u.username, e.id AS employee_id,
            e.first_name || ' ' || e.last_name AS employee_name, e.employee_code
     FROM users u
     INNER JOIN employees e ON e.id = u.employee_id
     WHERE e.status = 'ACTIVE'
     ORDER BY e.first_name ASC`,
  );
  return result.rows;
};

module.exports = {
  getByApplicantId,
  getByUserId,
  getById,
  create,
  update,
  remove,
  getPossibleInterviewers,
};
