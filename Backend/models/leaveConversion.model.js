const pool = require("../config/db");

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

const getByEmployeeAndYear = async (employee_id, year) => {
  const query = `
    SELECT * FROM leave_conversions
    WHERE employee_id = $1 AND year = $2
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [employee_id, year]);
  return result.rows;
};

const getTotalAmountForPayroll = async (employee_id, year) => {
  const query = `
    SELECT COALESCE(SUM(amount), 0) as total_amount
    FROM leave_conversions
    WHERE employee_id = $1 AND year = $2
  `;

  const result = await pool.query(query, [employee_id, year]);
  return parseFloat(result.rows[0].total_amount);
};

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
      elb.total_days,
      elb.used_days,
      elb.carried_over_days,
      elb.adjusted_days,
      elb.leave_type_id,
      lt.code AS leave_type_code,
      lt.default_days,
      lt.is_convertible,
      lt.max_convertible_days
    FROM employees e
    JOIN users u ON u.employee_id = e.id
    LEFT JOIN employee_salary es ON es.employee_id = e.id
    LEFT JOIN employee_leave_balances elb ON elb.employee_id = e.id
      AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    LEFT JOIN leave_types lt ON lt.id = elb.leave_type_id
    WHERE e.status = 'ACTIVE'
    AND u.role = 'EMPLOYEE'
    ORDER BY e.id
  `;

  const result = await pool.query(query);
  return result.rows;
};

const resetLeaveCredits = async (employee_id, leaveTypes, client = null) => {
  const db = client || pool;
  const now = new Date().getFullYear();

  for (const lt of leaveTypes) {
    await db.query(`
      INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, total_days, used_days, carried_over_days, adjusted_days)
      VALUES ($1, $2, $3, $4, 0, 0, 0)
      ON CONFLICT (employee_id, leave_type_id, year)
      DO UPDATE SET total_days = $4, used_days = 0, updated_at = CURRENT_TIMESTAMP
    `, [employee_id, lt.id, now, lt.default_days || 0]);
  }
};

const getLeaveTypeSettings = async (leave_code) => {
  const query = `
    SELECT
      id,
      code,
      default_days,
      is_convertible,
      max_convertible_days,
      requires_balance,
      is_unlimited
    FROM leave_types
    WHERE code = $1
  `;

  const result = await pool.query(query, [leave_code]);
  return result.rows[0];
};

const getAllBalanceTypes = async () => {
  const result = await pool.query(`
    SELECT id, code, default_days, max_convertible_days
    FROM leave_types
    WHERE is_enabled = true AND (include_in_credits = true OR requires_balance = true)
    ORDER BY sort_order, code
  `);
  return result.rows;
};

const getAllConvertibleTypes = async () => {
  const result = await pool.query(`
    SELECT id, code, default_days, max_convertible_days
    FROM leave_types
    WHERE is_enabled = true AND is_convertible = true
    ORDER BY sort_order, code
  `);
  return result.rows;
};

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

const deleteConversion = async (employee_id, year, leave_type) => {
  const query = `
    DELETE FROM leave_conversions
    WHERE employee_id = $1 AND year = $2 AND leave_type = $3
    RETURNING *
  `;

  const result = await pool.query(query, [employee_id, year, leave_type]);
  return result.rows[0];
};

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
  getAllConvertibleTypes,
  getAllBalanceTypes,
  getCompanySettings,
  deleteConversion,
  getByYear,
  getStatistics,
};
