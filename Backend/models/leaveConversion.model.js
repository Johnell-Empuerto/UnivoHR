const pool = require("../config/db");

// CREATE LEAVE CONVERSION RECORD
const create = async (data, client = null) => {
  const {
    employee_id,
    year,
    leave_type,
    days_converted,
    daily_rate,
    conversion_rate,
    amount,
    processed_by,
    remarks,
  } = data;

  const query = `
    INSERT INTO leave_conversions (
      employee_id,
      year,
      leave_type,
      days_converted,
      daily_rate,
      conversion_rate,
      amount,
      processed_by,
      remarks
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (employee_id, year, leave_type)
    DO UPDATE SET
      days_converted = EXCLUDED.days_converted,
      daily_rate = EXCLUDED.daily_rate,
      conversion_rate = EXCLUDED.conversion_rate,
      amount = EXCLUDED.amount,
      processed_by = EXCLUDED.processed_by,
      remarks = EXCLUDED.remarks,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const values = [
    employee_id,
    year,
    leave_type,
    days_converted,
    daily_rate,
    conversion_rate,
    amount,
    processed_by || null,
    remarks || null,
  ];

  if (client) {
    const result = await client.query(query, values);
    return result.rows[0];
  }

  const result = await pool.query(query, values);
  return result.rows[0];
};

// CHECK IF CONVERSION EXISTS FOR EMPLOYEE/YEAR/TYPE
const exists = async (employee_id, year, leave_type, client = null) => {
  const query = `
    SELECT 1 FROM leave_conversions
    WHERE employee_id = $1 AND year = $2 AND leave_type = $3
  `;

  if (client) {
    const result = await client.query(query, [employee_id, year, leave_type]);
    return result.rows.length > 0;
  }

  const result = await pool.query(query, [employee_id, year, leave_type]);
  return result.rows.length > 0;
};

// GET CONVERSION BY EMPLOYEE ID AND YEAR
const getByEmployeeAndYear = async (employee_id, year) => {
  const query = `
    SELECT * FROM leave_conversions
    WHERE employee_id = $1 AND year = $2
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [employee_id, year]);
  return result.rows;
};

// GET TOTAL CONVERSION AMOUNT FOR PAYROLL
const getTotalAmountForPayroll = async (employee_id, year) => {
  const query = `
    SELECT COALESCE(SUM(amount), 0) as total_amount
    FROM leave_conversions
    WHERE employee_id = $1 AND year = $2
  `;

  const result = await pool.query(query, [employee_id, year]);
  return parseFloat(result.rows[0].total_amount);
};

// GET EMPLOYEE CONVERSION HISTORY
const getEmployeeHistory = async (employee_id) => {
  const query = `
    SELECT
      lc.*,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code
    FROM leave_conversions lc
    JOIN employees e ON e.id = lc.employee_id
    WHERE lc.employee_id = $1
    ORDER BY lc.year DESC, lc.created_at DESC
  `;

  const result = await pool.query(query, [employee_id]);
  return result.rows;
};

// GET ALL ACTIVE EMPLOYEES WITH SALARY INFO
const getActiveEmployees = async () => {
  const query = `
    SELECT
      e.id,
      e.first_name,
      e.last_name,
      e.employee_code,
      e.status,
      es.basic_salary,
      es.working_days_per_month,
      es.daily_rate,
      lc.vacation_leave,
      lc.used_vacation_leave,
      lc.sick_leave,
      lc.used_sick_leave,
      lc.maternity_leave,
      lc.used_maternity_leave,
      lc.emergency_leave,
      lc.used_emergency_leave,
      lc.last_conversion_year
    FROM employees e
    JOIN users u ON u.employee_id = e.id
    LEFT JOIN employee_salary es ON es.employee_id = e.id
    LEFT JOIN leave_credits lc ON lc.employee_id = e.id
    WHERE e.status = 'ACTIVE'
    AND u.role = 'EMPLOYEE'
    ORDER BY e.id
  `;

  const result = await pool.query(query);
  return result.rows;
};

// RESET LEAVE CREDITS FOR NEW YEAR
const resetLeaveCredits = async (employee_id, leaveTypes, client = null) => {
  const query = `
    UPDATE leave_credits
    SET
      vacation_leave = $1,
      used_vacation_leave = 0,
      sick_leave = $2,
      used_sick_leave = 0,
      maternity_leave = $3,
      used_maternity_leave = 0,
      emergency_leave = $4,
      used_emergency_leave = 0,
      last_conversion_year = $5
    WHERE employee_id = $6
    RETURNING *
  `;

  const values = [
    leaveTypes.vacation_leave,
    leaveTypes.sick_leave,
    leaveTypes.maternity_leave,
    leaveTypes.emergency_leave,
    leaveTypes.conversion_year,
    employee_id,
  ];

  if (client) {
    const result = await client.query(query, values);
    return result.rows[0];
  }

  const result = await pool.query(query, values);
  return result.rows[0];
};

// GET LEAVE TYPE SETTINGS
const getLeaveTypeSettings = async (leave_code) => {
  const query = `
    SELECT
      default_days,
      is_convertible,
      max_convertible_days
    FROM leave_types
    WHERE code = $1
  `;

  const result = await pool.query(query, [leave_code]);
  return result.rows[0];
};

// GET COMPANY SETTINGS
const getCompanySettings = async () => {
  const query = `
    SELECT
      enforce_sil,
      sil_min_days,
      conversion_rate
    FROM company_settings
    LIMIT 1
  `;

  const result = await pool.query(query);
  return result.rows[0];
};

// DELETE CONVERSION (FOR ROLLBACK/ADMIN PURPOSES)
const deleteConversion = async (employee_id, year, leave_type) => {
  const query = `
    DELETE FROM leave_conversions
    WHERE employee_id = $1 AND year = $2 AND leave_type = $3
    RETURNING *
  `;

  const result = await pool.query(query, [employee_id, year, leave_type]);
  return result.rows[0];
};

// GET CONVERSIONS BY YEAR
const getByYear = async (year) => {
  const query = `
    SELECT
      lc.*,
      e.first_name,
      e.last_name,
      e.employee_code
    FROM leave_conversions lc
    JOIN employees e ON e.id = lc.employee_id
    WHERE lc.year = $1
    ORDER BY lc.created_at DESC
  `;

  const result = await pool.query(query, [year]);
  return result.rows;
};

// GET STATISTICS FOR SUMMARY
const getStatistics = async (year = null) => {
  let query = `
    SELECT
      COUNT(*) as total_conversions,
      COUNT(DISTINCT employee_id) as total_employees,
      COALESCE(SUM(days_converted), 0) as total_days,
      COALESCE(SUM(amount), 0) as total_amount,
      AVG(amount) as avg_amount
    FROM leave_conversions
  `;

  const params = [];
  if (year) {
    query += " WHERE year = $1";
    params.push(year);
  }

  const result = await pool.query(query, params);
  return result.rows[0];
};

module.exports = {
  create,
  exists,
  getByEmployeeAndYear,
  getTotalAmountForPayroll,
  getEmployeeHistory,
  getActiveEmployees,
  resetLeaveCredits,
  getLeaveTypeSettings,
  getCompanySettings,
  deleteConversion,
  getByYear,
  getStatistics,
};
