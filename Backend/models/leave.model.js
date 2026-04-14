const pool = require("../config/db");

// CREATE LEAVE (with half-day support)
const createLeave = async (data) => {
  const {
    employee_id,
    type,
    from_date,
    to_date,
    reason,
    day_fraction = 1,
    half_day_type = null,
  } = data;

  const query = `
    INSERT INTO leaves (employee_id, type, from_date, to_date, reason, day_fraction, half_day_type)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [
    employee_id,
    type,
    from_date,
    to_date,
    reason,
    day_fraction,
    half_day_type,
  ];

  const result = await pool.query(query, values);
  const leave = result.rows[0];

  // Convert day_fraction to number
  if (leave.day_fraction !== null && leave.day_fraction !== undefined) {
    leave.day_fraction = parseFloat(leave.day_fraction);
  }

  const employeeResult = await pool.query(
    `SELECT 
      id, 
      first_name, 
      last_name, 
      middle_name, 
      suffix, 
      employee_code 
    FROM employees WHERE id = $1`,
    [leave.employee_id],
  );

  const employee = employeeResult.rows[0];

  return {
    ...leave,
    employee_name:
      employee?.first_name && employee?.last_name
        ? `${employee.first_name} ${employee.middle_name || ""} ${employee.last_name}${employee.suffix ? `, ${employee.suffix}` : ""}`.trim()
        : `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim(),
    employee_code: employee?.employee_code,
  };
};

// GET ALL LEAVES
const getLeaves = async () => {
  const result = await pool.query(`
    SELECT 
      l.*, 
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      e.department
    FROM leaves l
    JOIN employees e ON e.id = l.employee_id
    ORDER BY l.created_at DESC
  `);

  return result.rows.map((row) => {
    if (row.day_fraction !== null && row.day_fraction !== undefined) {
      row.day_fraction = parseFloat(row.day_fraction);
    }

    return {
      ...row,
      employee_name:
        row.first_name && row.last_name
          ? `${row.first_name} ${row.middle_name || ""} ${row.last_name}${row.suffix ? `, ${row.suffix}` : ""}`.trim()
          : `${row.first_name || ""} ${row.last_name || ""}`.trim(),
    };
  });
};

// GET BY EMPLOYEE
const getByEmployee = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT 
      l.*, 
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code
    FROM leaves l
    JOIN employees e ON e.id = l.employee_id
    WHERE l.employee_id = $1
    ORDER BY l.created_at DESC
    `,
    [employeeId],
  );

  return result.rows.map((row) => {
    if (row.day_fraction !== null && row.day_fraction !== undefined) {
      row.day_fraction = parseFloat(row.day_fraction);
    }

    return {
      ...row,
      employee_name:
        row.first_name && row.last_name
          ? `${row.first_name} ${row.middle_name || ""} ${row.last_name}${row.suffix ? `, ${row.suffix}` : ""}`.trim()
          : `${row.first_name || ""} ${row.last_name || ""}`.trim(),
    };
  });
};

// GET BY ID
const getById = async (id, client = null) => {
  const query = `
    SELECT 
      l.*, 
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code
    FROM leaves l
    JOIN employees e ON e.id = l.employee_id
    WHERE l.id = $1
  `;
  const values = [id];

  let result;
  if (client) {
    result = await client.query(query, values);
  } else {
    result = await pool.query(query, values);
  }

  const row = result.rows[0];

  if (row) {
    if (row.day_fraction !== null && row.day_fraction !== undefined) {
      row.day_fraction = parseFloat(row.day_fraction);
    }

    row.employee_name =
      row.first_name && row.last_name
        ? `${row.first_name} ${row.middle_name || ""} ${row.last_name}${row.suffix ? `, ${row.suffix}` : ""}`.trim()
        : `${row.first_name || ""} ${row.last_name || ""}`.trim();
  }

  return row;
};

//  UPDATED: UPDATE STATUS with rejection_reason
const updateStatus = async (
  id,
  status,
  rejectionReason = null,
  client = null,
) => {
  let query;
  let values;

  if (status === "REJECTED" && rejectionReason) {
    query = `
      UPDATE leaves
      SET 
        status = $1,
        rejection_reason = $2
      WHERE id = $3
      RETURNING *;
    `;
    values = [status, rejectionReason, id];
  } else {
    query = `
      UPDATE leaves
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;
    values = [status, id];
  }

  if (client) {
    const result = await client.query(query, values);
    const updated = result.rows[0];
    if (
      updated &&
      updated.day_fraction !== null &&
      updated.day_fraction !== undefined
    ) {
      updated.day_fraction = parseFloat(updated.day_fraction);
    }
    return updated;
  }

  const result = await pool.query(query, values);
  const updated = result.rows[0];
  if (
    updated &&
    updated.day_fraction !== null &&
    updated.day_fraction !== undefined
  ) {
    updated.day_fraction = parseFloat(updated.day_fraction);
  }
  return updated;
};

module.exports = {
  createLeave,
  getLeaves,
  getByEmployee,
  getById,
  updateStatus,
};
