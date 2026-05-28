const pool = require("../config/db");

const getByApplicantId = async (applicantId) => {
  const result = await pool.query(
    `SELECT * FROM applicant_documents WHERE applicant_id = $1 ORDER BY uploaded_at DESC`,
    [applicantId],
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(`SELECT * FROM applicant_documents WHERE id = $1`, [id]);
  return result.rows[0];
};

const create = async (data) => {
  const { applicant_id, document_type, file_url, file_name } = data;
  const result = await pool.query(
    `INSERT INTO applicant_documents (applicant_id, document_type, file_url, file_name)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [applicant_id, document_type, file_url, file_name || null],
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(`DELETE FROM applicant_documents WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
};

module.exports = {
  getByApplicantId,
  getById,
  create,
  remove,
};
