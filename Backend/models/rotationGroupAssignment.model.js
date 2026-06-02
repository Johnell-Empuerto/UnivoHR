const pool = require("../config/db");

const getAll = async () => {
  const result = await pool.query(
    `SELECT rga.*, rg.name AS group_name, rp.name AS pattern_name,
            rp.cycle_days
     FROM rotation_group_assignments rga
     JOIN rotation_groups rg ON rg.id = rga.group_id
     JOIN rotation_patterns rp ON rp.id = rga.pattern_id
     ORDER BY rga.effective_date DESC`
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(
    `SELECT rga.*, rg.name AS group_name, rp.name AS pattern_name,
            rp.cycle_days
     FROM rotation_group_assignments rga
     JOIN rotation_groups rg ON rg.id = rga.group_id
     JOIN rotation_patterns rp ON rp.id = rga.pattern_id
     WHERE rga.id = $1`,
    [id]
  );
  return result.rows[0];
};

const create = async (data) => {
  const result = await pool.query(
    `INSERT INTO rotation_group_assignments (group_id, pattern_id, effective_date, end_date)
     VALUES ($1, $2, $3::date, $4::date)
     RETURNING *`,
    [data.group_id, data.pattern_id, data.effective_date, data.end_date || null]
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(
    "DELETE FROM rotation_group_assignments WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

const getEffectiveAssignment = async (groupId, date) => {
  const result = await pool.query(
    `SELECT rga.*, rp.cycle_days, rp.name AS pattern_name
     FROM rotation_group_assignments rga
     JOIN rotation_patterns rp ON rp.id = rga.pattern_id
     WHERE rga.group_id = $1
       AND rga.effective_date <= $2::date
       AND (rga.end_date IS NULL OR rga.end_date >= $2::date)
     ORDER BY rga.effective_date DESC
     LIMIT 1`,
    [groupId, date]
  );
  return result.rows[0] || null;
};

module.exports = {
  getAll,
  getById,
  create,
  remove,
  getEffectiveAssignment,
};
