const pool = require("../config/db");
const ValidationError = require("../utils/ValidationError");

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
  const { group_id, pattern_id, effective_date, end_date } = data;

  if (end_date && end_date <= effective_date) {
    throw new ValidationError("End date must be after the start date");
  }

  const groupCheck = await pool.query(
    "SELECT is_active FROM rotation_groups WHERE id = $1",
    [group_id]
  );
  if (groupCheck.rows.length === 0) {
    throw new ValidationError("Rotation group not found");
  }
  if (!groupCheck.rows[0].is_active) {
    throw new ValidationError("Cannot assign pattern to an inactive rotation group");
  }

  const patternCheck = await pool.query(
    "SELECT is_active FROM rotation_patterns WHERE id = $1",
    [pattern_id]
  );
  if (patternCheck.rows.length === 0) {
    throw new ValidationError("Rotation pattern not found");
  }
  if (!patternCheck.rows[0].is_active) {
    throw new ValidationError("Cannot assign an inactive rotation pattern");
  }

  const overlap = await pool.query(
    `SELECT id FROM rotation_group_assignments
     WHERE group_id = $1
       AND effective_date <= COALESCE($4, '9999-12-31'::date)
       AND (end_date IS NULL OR end_date >= $3)
     LIMIT 1`,
    [group_id, effective_date, effective_date, end_date || null]
  );
  if (overlap.rows.length > 0) {
    throw new ValidationError(
      "This group already has an assignment overlapping the given date range. " +
      "End the existing assignment first or choose a non-overlapping date range."
    );
  }

  const result = await pool.query(
    `INSERT INTO rotation_group_assignments (group_id, pattern_id, effective_date, end_date)
     VALUES ($1, $2, $3::date, $4::date)
     RETURNING *`,
    [group_id, pattern_id, effective_date, end_date || null]
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const existing = await getById(id);
  if (!existing) return null;

  const pattern_id = data.pattern_id || existing.pattern_id;
  const effective_date = data.effective_date || existing.effective_date;
  const end_date = data.hasOwnProperty("end_date") ? data.end_date : existing.end_date;

  if (end_date && end_date <= effective_date) {
    throw new ValidationError("End date must be after the start date");
  }

  if (data.pattern_id) {
    const patternCheck = await pool.query(
      "SELECT is_active FROM rotation_patterns WHERE id = $1",
      [data.pattern_id]
    );
    if (patternCheck.rows.length === 0) {
      throw new ValidationError("Rotation pattern not found");
    }
    if (!patternCheck.rows[0].is_active) {
      throw new ValidationError("Cannot assign an inactive rotation pattern");
    }
  }

  const overlap = await pool.query(
    `SELECT id FROM rotation_group_assignments
     WHERE group_id = $1
       AND id != $2
       AND effective_date <= COALESCE($5, '9999-12-31'::date)
       AND (end_date IS NULL OR end_date >= $4)
     LIMIT 1`,
    [existing.group_id, id, effective_date, effective_date, end_date || null]
  );
  if (overlap.rows.length > 0) {
    throw new ValidationError(
      "This group already has another assignment overlapping the given date range. " +
      "End the conflicting assignment first or choose a non-overlapping date range."
    );
  }

  const result = await pool.query(
    `UPDATE rotation_group_assignments SET
       pattern_id = $2,
       effective_date = $3::date,
       end_date = $4::date,
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, pattern_id, effective_date, end_date || null]
  );
  return result.rows[0];
};

const remove = async (id) => {
  const assignment = await getById(id);
  if (!assignment) return null;

  const activeEmployees = await pool.query(
    `SELECT COUNT(*)::int AS cnt
     FROM employee_rotation_group_assignments
     WHERE rotation_group_id = $1
       AND effective_date <= CURRENT_DATE
       AND (end_date IS NULL OR end_date >= CURRENT_DATE)`,
    [assignment.group_id]
  );
  const isActiveNow =
    assignment.effective_date <= new Date().toISOString().split("T")[0] &&
    (!assignment.end_date || assignment.end_date >= new Date().toISOString().split("T")[0]);

  if (isActiveNow && activeEmployees.rows[0].cnt > 0) {
    throw new ValidationError(
      `Cannot delete: ${activeEmployees.rows[0].cnt} active employee(s) are assigned to the group "${assignment.group_name}" and rely on this pattern assignment. Set an end date instead.`
    );
  }

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
  update,
  remove,
  getEffectiveAssignment,
};
