const pool = require("../config/db");

const getSummary = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE status = 'LEAVE') AS on_leave
    FROM attendance
    WHERE date = CURRENT_DATE
  `);

  return result.rows[0];
};

const getMySummary = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE status = 'LEAVE') AS on_leave
    FROM attendance
    WHERE employee_id = $1
    AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
  `,
    [employeeId],
  );

  return result.rows[0];
};

const getTodayStatus = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT status, check_in_time, check_out_time
    FROM attendance
    WHERE employee_id = $1
    AND date = CURRENT_DATE
  `,
    [employeeId],
  );

  return result.rows[0];
};

const getAdminStats = async () => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE') AS total_employees,
      (SELECT COUNT(*) FROM attendance 
        WHERE status = 'LEAVE' 
        AND date = CURRENT_DATE
      ) AS on_leave_today
  `);

  return result.rows[0];
};

const getEmployeeTrend = async () => {
  const result = await pool.query(`
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM') AS month,
      COUNT(*) AS total
    FROM employees
    GROUP BY month
    ORDER BY month
  `);

  return result.rows;
};

const getAbsentTrend = async () => {
  const result = await pool.query(`
    SELECT 
      TO_CHAR(date, 'YYYY-MM') AS month,
      COUNT(*) FILTER (WHERE status = 'ABSENT') AS absent
    FROM attendance
    GROUP BY month
    ORDER BY month
  `);

  return result.rows;
};

const getAdminAnalytics = async () => {
  const [stats, growth, absent, daily, weekly] = await Promise.all([
    getAdminStats(),
    getEmployeeGrowth(),
    getAbsentTrend(),
    getDailyBreakdown(),
    getWeeklyTrend(),
  ]);

  return {
    stats,
    employee_growth: growth,
    absent_trend: absent,
    daily_breakdown: daily,
    weekly_trend: weekly,
  };
};

const getDailyBreakdown = async () => {
  const result = await pool.query(`
    SELECT 
      date,
      COUNT(*) FILTER (WHERE status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE status = 'LEAVE') AS leave
    FROM attendance
    WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY date
    ORDER BY date
  `);

  return result.rows;
};

const getMonthlyComparison = async () => {
  const result = await pool.query(`
    SELECT
      DATE_TRUNC('month', date) AS month,
      COUNT(*) FILTER (WHERE status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE status = 'LEAVE') AS on_leave
    FROM attendance
    WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    GROUP BY month
    ORDER BY month;
  `);

  return result.rows;
};

const getWeeklyTrend = async () => {
  const result = await pool.query(`
    SELECT 
      TO_CHAR(date, 'Dy') AS day,
      COUNT(*) FILTER (WHERE status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE status = 'LEAVE') AS on_leave,
      EXTRACT(DOW FROM date) AS dow
    FROM attendance
    WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY day, dow
    ORDER BY dow
  `);

  return result.rows;
};

const getEmployeeGrowth = async () => {
  const result = await pool.query(`
    SELECT 
      month,
      SUM(total) OVER (ORDER BY month) AS total
    FROM (
      SELECT 
        TO_CHAR(hired_date, 'YYYY-MM') AS month,
        COUNT(*) AS total
      FROM employees
      GROUP BY month
    ) t
    ORDER BY month
  `);

  return result.rows;
};

const getMyMonthlyComparison = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT
      DATE_TRUNC('month', date) AS month,
      COUNT(*) FILTER (WHERE status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE status = 'LEAVE') AS on_leave
    FROM attendance
    WHERE employee_id = $1
    AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    GROUP BY month
    ORDER BY month;
  `,
    [employeeId],
  );

  return result.rows;
};

module.exports = {
  getSummary,
  getMySummary,
  getTodayStatus,
  getAdminStats,
  getEmployeeTrend,
  getAbsentTrend,
  getAdminAnalytics,
  getDailyBreakdown,
  getWeeklyTrend,
  getEmployeeGrowth,
  getMonthlyComparison,
  getMyMonthlyComparison,
};
