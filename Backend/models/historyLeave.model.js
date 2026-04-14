const pool = require("../config/db");

// GET ALL LEAVE CONVERSIONS WITH EMPLOYEE DETAILS
const getAll = async (page = 1, limit = 10, search = "", year = null) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT 
      lc.*,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code
    FROM leave_conversions lc
    JOIN employees e ON e.id = lc.employee_id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  // Add search filter
  if (search) {
    query += ` AND (
      e.first_name ILIKE $${paramIndex} OR 
      e.last_name ILIKE $${paramIndex} OR 
      e.employee_code ILIKE $${paramIndex} OR
      CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $${paramIndex}
    )`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Add year filter
  if (year) {
    query += ` AND lc.year = $${paramIndex}`;
    params.push(year);
    paramIndex++;
  }

  // Add sorting and pagination
  query += ` ORDER BY lc.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count for pagination
  let countQuery = `
    SELECT COUNT(*) 
    FROM leave_conversions lc
    JOIN employees e ON e.id = lc.employee_id
    WHERE 1=1
  `;
  const countParams = [];
  let countIndex = 1;

  if (search) {
    countQuery += ` AND (
      e.first_name ILIKE $${countIndex} OR 
      e.last_name ILIKE $${countIndex} OR 
      e.employee_code ILIKE $${countIndex} OR
      CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $${countIndex}
    )`;
    countParams.push(`%${search}%`);
    countIndex++;
  }

  if (year) {
    countQuery += ` AND lc.year = $${countIndex}`;
    countParams.push(year);
  }

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  return {
    data: result.rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// GET SUMMARY STATS
const getSummary = async () => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_conversions,
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(DISTINCT employee_id) as total_employees,
      COUNT(DISTINCT year) as total_years,
      COALESCE(SUM(days_converted), 0) as total_days_converted
    FROM leave_conversions
  `);
  return result.rows[0];
};

// GET YEARLY SUMMARY
const getYearlySummary = async () => {
  const result = await pool.query(`
    SELECT 
      year,
      COUNT(*) as conversion_count,
      COUNT(DISTINCT employee_id) as employees_count,
      COALESCE(SUM(days_converted), 0) as total_days,
      COALESCE(SUM(amount), 0) as total_amount
    FROM leave_conversions
    GROUP BY year
    ORDER BY year DESC
  `);
  return result.rows;
};

// GET EMPLOYEE SUMMARY
const getEmployeeSummary = async (employee_id) => {
  const result = await pool.query(
    `
    SELECT 
      e.id,
      e.first_name,
      e.last_name,
      e.employee_code,
      COUNT(lc.id) as conversion_count,
      COALESCE(SUM(lc.days_converted), 0) as total_days,
      COALESCE(SUM(lc.amount), 0) as total_amount
    FROM employees e
    LEFT JOIN leave_conversions lc ON lc.employee_id = e.id
    WHERE e.id = $1
    GROUP BY e.id, e.first_name, e.last_name, e.employee_code
  `,
    [employee_id],
  );
  return result.rows[0];
};

// GET AVAILABLE YEARS FOR FILTER
const getAvailableYears = async () => {
  const result = await pool.query(`
    SELECT DISTINCT year 
    FROM leave_conversions 
    ORDER BY year DESC
  `);
  return result.rows.map((row) => row.year);
};

module.exports = {
  getAll,
  getSummary,
  getYearlySummary,
  getEmployeeSummary,
  getAvailableYears,
};
