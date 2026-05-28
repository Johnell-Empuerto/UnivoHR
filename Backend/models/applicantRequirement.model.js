const pool = require("../config/db");

const getByApplicantId = async (applicantId) => {
  const result = await pool.query(
    `SELECT * FROM applicant_requirements WHERE applicant_id = $1 ORDER BY created_at ASC`,
    [applicantId],
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM applicant_requirements WHERE id = $1`,
    [id],
  );
  return result.rows[0];
};

const create = async (data) => {
  const { applicant_id, requirement_name, status, remarks } = data;
  const result = await pool.query(
    `INSERT INTO applicant_requirements (applicant_id, requirement_name, status, remarks)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [applicant_id, requirement_name, status || "Pending", remarks || null],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { requirement_name, status, remarks, verified_date } = data;
  const result = await pool.query(
    `UPDATE applicant_requirements SET
       requirement_name = $1,
       status = $2,
       remarks = $3,
       verified_date = $4,
       updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [
      requirement_name,
      status || "Pending",
      remarks !== undefined ? remarks : null,
      verified_date || null,
      id,
    ],
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(
    `DELETE FROM applicant_requirements WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0];
};

module.exports = {
  getByApplicantId,
  getById,
  create,
  update,
  remove,
};
