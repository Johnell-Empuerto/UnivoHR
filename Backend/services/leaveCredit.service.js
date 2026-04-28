const leaveCreditModel = require("../models/leaveCredit.model");

const getMyCredits = async (employeeId) => {
  let credits = await leaveCreditModel.getByEmployee(employeeId);

  // AUTO CREATE IF NOT EXISTS
  if (!credits) {
    credits = await leaveCreditModel.createDefault(employeeId);
  }

  // Add calculated fields for frontend convenience
  return {
    ...credits,
    sick_leave_remaining: credits.sick_leave - credits.used_sick_leave,
    vacation_leave_remaining:
      credits.vacation_leave - credits.used_vacation_leave,
    maternity_leave_remaining:
      credits.maternity_leave - credits.used_maternity_leave,

    emergency_leave_remaining:
      credits.emergency_leave - credits.used_emergency_leave,
  };
};

// GET ALL EMPLOYEES WITH CREDITS (ADMIN/HR)
const getAllCredits = async (
  page = 1,
  limit = 10,
  search = "",
  department = "",
) => {
  const pool = require("../config/db");
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      lc.*,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      e.department,
      e.position
    FROM leave_credits lc
    JOIN employees e ON e.id = lc.employee_id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (
      e.first_name ILIKE $${paramIndex} OR
      e.last_name ILIKE $${paramIndex} OR
      e.employee_code ILIKE $${paramIndex}
    )`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (department) {
    query += ` AND e.department = $${paramIndex}`;
    params.push(department);
    paramIndex++;
  }

  query += ` ORDER BY e.first_name, e.last_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count
  let countQuery = `
    SELECT COUNT(*)
    FROM leave_credits lc
    JOIN employees e ON e.id = lc.employee_id
    WHERE 1=1
  `;
  const countParams = [];
  let countIndex = 1;

  if (search) {
    countQuery += ` AND (
      e.first_name ILIKE $${countIndex} OR
      e.last_name ILIKE $${countIndex} OR
      e.employee_code ILIKE $${countIndex}
    )`;
    countParams.push(`%${search}%`);
    countIndex++;
  }

  if (department) {
    countQuery += ` AND e.department = $${countIndex}`;
    countParams.push(department);
  }

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  // Add calculated fields
  const data = result.rows.map((credit) => ({
    ...credit,
    sick_leave_remaining: credit.sick_leave - credit.used_sick_leave,
    vacation_leave_remaining:
      credit.vacation_leave - credit.used_vacation_leave,
    maternity_leave_remaining:
      credit.maternity_leave - credit.used_maternity_leave,
    emergency_leave_remaining:
      credit.emergency_leave - credit.used_emergency_leave,
  }));

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// GET SINGLE EMPLOYEE CREDITS (ADMIN/HR)
const getEmployeeCredits = async (employeeId) => {
  let credits = await leaveCreditModel.getByEmployee(employeeId);

  if (!credits) {
    credits = await leaveCreditModel.createDefault(employeeId);
  }

  return {
    ...credits,
    sick_leave_remaining: credits.sick_leave - credits.used_sick_leave,
    vacation_leave_remaining:
      credits.vacation_leave - credits.used_vacation_leave,
    maternity_leave_remaining:
      credits.maternity_leave - credits.used_maternity_leave,
    emergency_leave_remaining:
      credits.emergency_leave - credits.used_emergency_leave,
  };
};

// UPDATE EMPLOYEE CREDITS (ADMIN/HR)
const updateCredits = async (employeeId, updates) => {
  const pool = require("../config/db");

  const { sick_leave, vacation_leave, maternity_leave, emergency_leave } =
    updates;

  let query = `UPDATE leave_credits SET`;
  const params = [];
  let paramIndex = 1;

  // ✅ renamed here
  const updateFields = [];

  if (sick_leave !== undefined) {
    updateFields.push(`sick_leave = $${paramIndex}`);
    params.push(sick_leave);
    paramIndex++;
  }

  if (vacation_leave !== undefined) {
    updateFields.push(`vacation_leave = $${paramIndex}`);
    params.push(vacation_leave);
    paramIndex++;
  }

  if (maternity_leave !== undefined) {
    updateFields.push(`maternity_leave = $${paramIndex}`);
    params.push(maternity_leave);
    paramIndex++;
  }

  if (emergency_leave !== undefined) {
    updateFields.push(`emergency_leave = $${paramIndex}`);
    params.push(emergency_leave);
    paramIndex++;
  }

  if (updateFields.length === 0) {
    throw new Error("No valid fields to update");
  }

  query += ` ${updateFields.join(", ")}`;
  query += ` WHERE employee_id = $${paramIndex}`;
  params.push(employeeId);
  query += ` RETURNING *`;

  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    throw new Error("Employee credits not found");
  }

  const credit = result.rows[0];

  return {
    ...credit,
    sick_leave_remaining: credit.sick_leave - credit.used_sick_leave,
    vacation_leave_remaining:
      credit.vacation_leave - credit.used_vacation_leave,
    maternity_leave_remaining:
      credit.maternity_leave - credit.used_maternity_leave,
    emergency_leave_remaining:
      credit.emergency_leave - credit.used_emergency_leave,
  };
};

module.exports = {
  getMyCredits,
  getAllCredits,
  getEmployeeCredits,
  updateCredits,
};
