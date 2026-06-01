const pool = require("../config/db");

const getAllByApplicantId = async (applicantId) => {
  const result = await pool.query(
    "SELECT * FROM applicant_education WHERE applicant_id = $1 ORDER BY year_started DESC NULLS LAST, id DESC",
    [applicantId],
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query("SELECT * FROM applicant_education WHERE id = $1", [id]);
  return result.rows[0];
};

const create = async (data) => {
  const result = await pool.query(
    `INSERT INTO applicant_education
     (applicant_id, education_level, school_name, course_or_degree, year_started, year_graduated, honors_awards)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.applicant_id, data.education_level, data.school_name,
     data.course_or_degree || null, data.year_started || null,
     data.year_graduated || null, data.honors_awards || null],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const result = await pool.query(
    `UPDATE applicant_education SET
      education_level = $1, school_name = $2, course_or_degree = $3,
      year_started = $4, year_graduated = $5, honors_awards = $6,
      updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [data.education_level, data.school_name, data.course_or_degree || null,
     data.year_started || null, data.year_graduated || null,
     data.honors_awards || null, id],
  );
  return result.rows[0];
};

const remove = async (id) => {
  await pool.query("DELETE FROM applicant_education WHERE id = $1", [id]);
};

module.exports = { getAllByApplicantId, getById, create, update, remove };
