const pool = require("../config/db");

const getAllByApplicantId = async (applicantId) => {
  const result = await pool.query(
    "SELECT * FROM applicant_work_experience WHERE applicant_id = $1 ORDER BY start_date DESC NULLS LAST, id DESC",
    [applicantId],
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query("SELECT * FROM applicant_work_experience WHERE id = $1", [id]);
  return result.rows[0];
};

const create = async (data) => {
  const result = await pool.query(
    `INSERT INTO applicant_work_experience
     (applicant_id, company_name, position, start_date, end_date, reason_for_leaving)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [data.applicant_id, data.company_name, data.position,
     data.start_date || null, data.end_date || null, data.reason_for_leaving || null],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const result = await pool.query(
    `UPDATE applicant_work_experience SET
      company_name = $1, position = $2, start_date = $3,
      end_date = $4, reason_for_leaving = $5, updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [data.company_name, data.position, data.start_date || null,
     data.end_date || null, data.reason_for_leaving || null, id],
  );
  return result.rows[0];
};

const remove = async (id) => {
  await pool.query("DELETE FROM applicant_work_experience WHERE id = $1", [id]);
};

module.exports = { getAllByApplicantId, getById, create, update, remove };
