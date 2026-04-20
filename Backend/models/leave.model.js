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
// GET ALL LEAVES WITH PAGINATION
const getLeaves = async (
  page = 1,
  limit = 10,
  search = "",
  status = "",
  type = "",
) => {
  const offset = (page - 1) * limit;
  const searchValue = `%${search}%`;

  const dataQuery = await pool.query(
    `
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
    WHERE
      ($3 = '' OR l.status = $3)
      AND ($4 = '' OR l.type = $4)
      AND (
        $2 = '' OR 
        e.first_name ILIKE $2 OR 
        e.last_name ILIKE $2 OR 
        e.employee_code ILIKE $2 OR
        CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $2
      )
    ORDER BY l.created_at DESC
    LIMIT $1 OFFSET $5
    `,
    [limit, searchValue, status, type, offset],
  );

  const countQuery = await pool.query(
    `
    SELECT COUNT(*)
    FROM leaves l
    JOIN employees e ON e.id = l.employee_id
    WHERE
      ($1 = '' OR l.status = $1)
      AND ($2 = '' OR l.type = $2)
      AND (
        $3 = '' OR 
        e.first_name ILIKE $3 OR 
        e.last_name ILIKE $3 OR 
        e.employee_code ILIKE $3 OR
        CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $3
      )
    `,
    [status, type, searchValue],
  );

  const total = parseInt(countQuery.rows[0].count);

  // Format the data
  const formattedData = dataQuery.rows.map((row) => {
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

  return {
    data: formattedData,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};
// GET BY EMPLOYEE
// GET BY EMPLOYEE WITH PAGINATION
const getByEmployee = async (employeeId, page = 1, limit = 10, status = "") => {
  const offset = (page - 1) * limit;

  const dataQuery = await pool.query(
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
      AND ($4 = '' OR l.status = $4)
    ORDER BY l.created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [employeeId, limit, offset, status],
  );

  const countQuery = await pool.query(
    `
    SELECT COUNT(*)
    FROM leaves l
    WHERE l.employee_id = $1
      AND ($2 = '' OR l.status = $2)
    `,
    [employeeId, status],
  );

  const total = parseInt(countQuery.rows[0].count);

  const formattedData = dataQuery.rows.map((row) => {
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

  return {
    data: formattedData,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
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
