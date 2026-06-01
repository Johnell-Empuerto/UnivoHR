const pool = require("../config/db");

const getAll = async () => {
  const result = await pool.query(
    "SELECT * FROM shift_schedules ORDER BY is_active DESC, name ASC"
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM shift_schedules WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

const create = async (data) => {
  const result = await pool.query(
    `INSERT INTO shift_schedules (name, code, type, start_time, end_time, description, is_active,
        break_start, break_end, grace_minutes, required_hours,
        flex_start_window, flex_end_window, is_night_shift, is_flexitime)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [data.name, data.code || null, data.type, data.start_time, data.end_time,
     data.description || null, data.is_active !== false,
     data.break_start || null, data.break_end || null,
     data.grace_minutes ?? 0, data.required_hours ?? 8,
     data.flex_start_window || null, data.flex_end_window || null,
     data.is_night_shift || false, data.is_flexitime || false]
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const result = await pool.query(
    `UPDATE shift_schedules SET
       name = COALESCE($1, name),
       code = COALESCE($2, code),
       type = COALESCE($3, type),
       start_time = COALESCE($4, start_time),
       end_time = COALESCE($5, end_time),
       description = COALESCE($6, description),
       is_active = COALESCE($7, is_active),
       break_start = COALESCE($8, break_start),
       break_end = COALESCE($9, break_end),
       grace_minutes = COALESCE($10, grace_minutes),
       required_hours = COALESCE($11, required_hours),
       flex_start_window = COALESCE($12, flex_start_window),
       flex_end_window = COALESCE($13, flex_end_window),
       is_night_shift = COALESCE($14, is_night_shift),
       is_flexitime = COALESCE($15, is_flexitime),
       updated_at = NOW()
     WHERE id = $16
     RETURNING *`,
    [data.name, data.code, data.type, data.start_time, data.end_time,
     data.description, data.is_active,
     data.break_start, data.break_end,
     data.grace_minutes, data.required_hours,
     data.flex_start_window, data.flex_end_window,
     data.is_night_shift, data.is_flexitime, id]
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(
    "DELETE FROM shift_schedules WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

const getActiveShifts = async () => {
  const result = await pool.query(
    "SELECT * FROM shift_schedules WHERE is_active = true ORDER BY name ASC"
  );
  return result.rows;
};

const getEmployeeShiftForDate = async (employeeId, date) => {
  const result = await pool.query(
    `SELECT ss.* FROM employee_shift_assignments esa
     JOIN shift_schedules ss ON ss.id = esa.shift_id
     WHERE esa.employee_id = $1
       AND esa.effective_date <= $2::date
       AND (esa.end_date IS NULL OR esa.end_date >= $2::date)
       AND ss.is_active = true
     ORDER BY esa.effective_date DESC
     LIMIT 1`,
    [employeeId, date]
  );
  return result.rows[0] || null;
};

const assignShift = async (employeeId, shiftId, effectiveDate, endDate) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // End any active overlapping assignment by setting end_date to day before new effective_date
    await client.query(
      `UPDATE employee_shift_assignments
       SET end_date = $2::date - INTERVAL '1 day',
           updated_at = NOW()
       WHERE employee_id = $1
         AND (end_date IS NULL OR end_date >= $2::date)
         AND effective_date < $2::date`,
      [employeeId, effectiveDate]
    );

    const result = await client.query(
      `INSERT INTO employee_shift_assignments (employee_id, shift_id, effective_date, end_date)
       VALUES ($1, $2, $3::date, $4::date) RETURNING *`,
      [employeeId, shiftId, effectiveDate, endDate || null]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getAssignments = async (employeeId) => {
  const result = await pool.query(
    `SELECT esa.*, ss.name AS shift_name, ss.type AS shift_type,
            ss.start_time, ss.end_time, ss.code AS shift_code
     FROM employee_shift_assignments esa
     JOIN shift_schedules ss ON ss.id = esa.shift_id
     WHERE esa.employee_id = $1
     ORDER BY esa.effective_date DESC`,
    [employeeId]
  );
  return result.rows;
};

const removeAssignment = async (id) => {
  const result = await pool.query(
    "DELETE FROM employee_shift_assignments WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getActiveShifts,
  getEmployeeShiftForDate,
  assignShift,
  getAssignments,
  removeAssignment,
};
