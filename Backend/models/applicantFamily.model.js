const pool = require("../config/db");

const getAllByApplicantId = async (applicantId) => {
  const result = await pool.query(
    "SELECT * FROM applicant_family_members WHERE applicant_id = $1 ORDER BY created_at DESC",
    [applicantId],
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query("SELECT * FROM applicant_family_members WHERE id = $1", [id]);
  return result.rows[0];
};

const create = async (data) => {
  const result = await pool.query(
    `INSERT INTO applicant_family_members
     (applicant_id, relationship_type, full_name, birthdate, occupation, contact_number, address, is_dependent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.applicant_id, data.relationship_type, data.full_name,
     data.birthdate || null, data.occupation || null, data.contact_number || null,
     data.address || null, data.is_dependent || false],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const result = await pool.query(
    `UPDATE applicant_family_members SET
      relationship_type = $1, full_name = $2, birthdate = $3,
      occupation = $4, contact_number = $5, address = $6,
      is_dependent = $7, updated_at = NOW()
     WHERE id = $8 RETURNING *`,
    [data.relationship_type, data.full_name, data.birthdate || null,
     data.occupation || null, data.contact_number || null, data.address || null,
     data.is_dependent || false, id],
  );
  return result.rows[0];
};

const remove = async (id) => {
  await pool.query("DELETE FROM applicant_family_members WHERE id = $1", [id]);
};

module.exports = { getAllByApplicantId, getById, create, update, remove };
