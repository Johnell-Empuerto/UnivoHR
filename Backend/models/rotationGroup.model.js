const pool = require("../config/db");
const ValidationError = require("../utils/ValidationError");

const getAll = async () => {
  const result = await pool.query(
    `SELECT rg.*,
            COUNT(DISTINCT erga.employee_id) FILTER (
              WHERE erga.end_date IS NULL OR erga.end_date >= CURRENT_DATE
            ) AS member_count
     FROM rotation_groups rg
     LEFT JOIN employee_rotation_group_assignments erga ON erga.rotation_group_id = rg.id
       AND erga.effective_date <= CURRENT_DATE
       AND (erga.end_date IS NULL OR erga.end_date >= CURRENT_DATE)
     GROUP BY rg.id
     ORDER BY rg.is_active DESC, rg.name ASC`
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(
    `SELECT rg.*,
            COUNT(DISTINCT erga.employee_id) FILTER (
              WHERE erga.end_date IS NULL OR erga.end_date >= CURRENT_DATE
            ) AS member_count
     FROM rotation_groups rg
     LEFT JOIN employee_rotation_group_assignments erga ON erga.rotation_group_id = rg.id
       AND erga.effective_date <= CURRENT_DATE
       AND (erga.end_date IS NULL OR erga.end_date >= CURRENT_DATE)
     WHERE rg.id = $1
     GROUP BY rg.id`,
    [id]
  );
  return result.rows[0];
};

const create = async (data) => {
  const result = await pool.query(
    `INSERT INTO rotation_groups (name, code, description, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.name, data.code || null, data.description || null, data.is_active !== false]
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const result = await pool.query(
    `UPDATE rotation_groups SET
       name = COALESCE($1, name),
       code = COALESCE($2, code),
       description = COALESCE($3, description),
       is_active = COALESCE($4, is_active),
       updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [data.name, data.code, data.description, data.is_active, id]
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(
    "DELETE FROM rotation_groups WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

const getMembers = async (groupId) => {
  const result = await pool.query(
    `SELECT e.id, e.employee_code, e.first_name, e.last_name, e.department,
            e.status, e.position AS position_name,
            erga.effective_date, erga.end_date
     FROM employee_rotation_group_assignments erga
     JOIN employees e ON e.id = erga.employee_id
     WHERE erga.rotation_group_id = $1
       AND erga.effective_date <= CURRENT_DATE
       AND (erga.end_date IS NULL OR erga.end_date >= CURRENT_DATE)
     ORDER BY e.last_name ASC, e.first_name ASC`,
    [groupId]
  );
  return result.rows;
};

const getEmployeeGroupAssignment = async (employeeId, date) => {
  const result = await pool.query(
    `SELECT erga.*, rg.name AS group_name
     FROM employee_rotation_group_assignments erga
     JOIN rotation_groups rg ON rg.id = erga.rotation_group_id
     WHERE erga.employee_id = $1
       AND erga.effective_date <= $2::date
       AND (erga.end_date IS NULL OR erga.end_date >= $2::date)
     ORDER BY erga.effective_date DESC
     LIMIT 1`,
    [employeeId, date]
  );
  return result.rows[0] || null;
};

const assignEmployeeToGroup = async (employeeId, groupId, effectiveDate) => {
  const client = await pool.connect();
  try {
    const overlap = await client.query(
      `SELECT id FROM employee_rotation_group_assignments
       WHERE employee_id = $1
         AND rotation_group_id = $2
         AND effective_date <= $3::date
         AND (end_date IS NULL OR end_date >= $3::date)
       LIMIT 1`,
      [employeeId, groupId, effectiveDate]
    );
    if (overlap.rows.length > 0) {
      throw new ValidationError("Employee already has an active assignment to this rotation group for the given date range");
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE employee_rotation_group_assignments
       SET end_date = $2::date - INTERVAL '1 day',
           updated_at = NOW()
       WHERE employee_id = $1
         AND end_date IS NULL
         AND effective_date <= $2::date`,
      [employeeId, effectiveDate]
    );

    const result = await client.query(
      `INSERT INTO employee_rotation_group_assignments
         (employee_id, rotation_group_id, effective_date)
       VALUES ($1, $2, $3::date)
       RETURNING *`,
      [employeeId, groupId, effectiveDate]
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

const removeEmployeeFromGroup = async (employeeId, effectiveDate) => {
  const result = await pool.query(
    `UPDATE employee_rotation_group_assignments
     SET end_date = $2::date - INTERVAL '1 day',
         updated_at = NOW()
     WHERE employee_id = $1
       AND end_date IS NULL
       AND effective_date <= $2::date
     RETURNING *`,
    [employeeId, effectiveDate]
  );
  return result.rows[0] || null;
};

const getEmployeeAssignments = async (employeeId) => {
  const result = await pool.query(
    `SELECT erga.*, rg.name AS group_name, rg.code AS group_code
     FROM employee_rotation_group_assignments erga
     JOIN rotation_groups rg ON rg.id = erga.rotation_group_id
     WHERE erga.employee_id = $1
     ORDER BY erga.effective_date DESC`,
    [employeeId]
  );
  return result.rows;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getMembers,
  getEmployeeGroupAssignment,
  getEmployeeAssignments,
  assignEmployeeToGroup,
  removeEmployeeFromGroup,
};
