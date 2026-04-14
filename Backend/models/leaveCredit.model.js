const pool = require("../config/db");

// GET MY CREDITS
const getByEmployee = async (employeeId) => {
  const result = await pool.query(
    "SELECT * FROM leave_credits WHERE employee_id = $1",
    [employeeId],
  );
  return result.rows[0];
};

// CREATE DEFAULT (when employee created)
const createDefault = async (employeeId) => {
  const result = await pool.query(
    `INSERT INTO leave_credits (employee_id, sick_leave, vacation_leave, maternity_leave,emergency_leave) VALUES ($1, 15, 15, 60, 5)
     RETURNING *`,
    [employeeId],
  );
  return result.rows[0];
};

// UPDATE USED LEAVE with transaction support
const useLeave = async (employeeId, type, days, client = null) => {
  if (type === "SICK") {
    const query = `
      UPDATE leave_credits
      SET used_sick_leave = used_sick_leave + $1
      WHERE employee_id = $2
      RETURNING *
    `;

    if (client) {
      const result = await client.query(query, [days, employeeId]);
      return result.rows[0];
    }

    const result = await pool.query(query, [days, employeeId]);
    return result.rows[0];
  }

  // MATERNITY
  if (type === "MATERNITY") {
    const query = `
    UPDATE leave_credits
    SET used_maternity_leave = used_maternity_leave + $1
    WHERE employee_id = $2
    RETURNING *
  `;

    if (client) {
      const result = await client.query(query, [days, employeeId]);
      return result.rows[0];
    }

    const result = await pool.query(query, [days, employeeId]);
    return result.rows[0];
  }

  // EMERGENCY
  if (type === "EMERGENCY") {
    const query = `
    UPDATE leave_credits
    SET used_emergency_leave = used_emergency_leave + $1
    WHERE employee_id = $2
    RETURNING *
  `;

    if (client) {
      const result = await client.query(query, [days, employeeId]);
      return result.rows[0];
    }

    const result = await pool.query(query, [days, employeeId]);
    return result.rows[0];
  }

  // NO PAY (no deduction)
  if (type === "NO_PAY") {
    return;
  }

  if (type === "ANNUAL") {
    const query = `
      UPDATE leave_credits
      SET used_vacation_leave = used_vacation_leave + $1
      WHERE employee_id = $2
      RETURNING *
    `;

    if (client) {
      const result = await client.query(query, [days, employeeId]);
      return result.rows[0];
    }

    const result = await pool.query(query, [days, employeeId]);
    return result.rows[0];
  }

  throw new Error("Invalid leave type");
};

module.exports = {
  getByEmployee,
  createDefault,
  useLeave,
};
