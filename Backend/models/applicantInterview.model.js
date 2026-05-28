const pool = require("../config/db");

const getByApplicantId = async (applicantId) => {
  const result = await pool.query(
    `SELECT * FROM applicant_interviews WHERE applicant_id = $1 ORDER BY interview_date DESC`,
    [applicantId],
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(`SELECT * FROM applicant_interviews WHERE id = $1`, [id]);
  return result.rows[0];
};

const create = async (data) => {
  const { applicant_id, interview_date, interviewer, interview_type, notes, rating, status } = data;
  const result = await pool.query(
    `INSERT INTO applicant_interviews (applicant_id, interview_date, interviewer, interview_type, notes, rating, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [applicant_id, interview_date, interviewer || null, interview_type || null, notes || null, rating ? Math.min(9.99, parseFloat(rating)) : null, status || 'SCHEDULED'],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { interview_date, interviewer, interview_type, notes, rating, status } = data;
  const result = await pool.query(
    `UPDATE applicant_interviews SET interview_date = $1, interviewer = $2, interview_type = $3, notes = $4, rating = $5, status = $6, updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [interview_date, interviewer || null, interview_type || null, notes || null, rating ? Math.min(9.99, parseFloat(rating)) : null, status || 'SCHEDULED', id],
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(`DELETE FROM applicant_interviews WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
};

module.exports = {
  getByApplicantId,
  getById,
  create,
  update,
  remove,
};
