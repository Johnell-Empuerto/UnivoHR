const pool = require("../config/db");

const buildBranchClause = (params, allowedBranchIds) => {
  if (allowedBranchIds && allowedBranchIds.length > 0) {
    return `AND e.branch_id = ANY($${params.length + 1}::int[])`;
  }
  return "";
};

const buildDateClause = (params, startDate, endDate, alias = "a") => {
  const clauses = [];
  if (startDate) {
    clauses.push(`AND ${alias}.date >= $${params.length + 1}::date`);
    params.push(startDate);
  }
  if (endDate) {
    clauses.push(`AND ${alias}.date <= $${params.length + 1}::date`);
    params.push(endDate);
  }
  return clauses.join(" ");
};

const buildBranchClauseSimple = (params, allowedBranchIds) => {
  if (allowedBranchIds && allowedBranchIds.length > 0) {
    params.push(allowedBranchIds);
    return `AND branch_id = ANY($${params.length}::int[])`;
  }
  return "";
};

const getSummary = async (allowedBranchIds = null, startDate = null, endDate = null) => {
  const params = [];
  const branchClause = buildBranchClause(params, allowedBranchIds);
  const dateClause = buildDateClause(params, startDate, endDate);

  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE a.status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE a.status = 'LEAVE') AS on_leave
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE (1=1)
      ${branchClause}
      ${dateClause}
  `, params);

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

const getAdminStats = async (allowedBranchIds = null) => {
  const params = [];
  const branchSuffix = buildBranchClauseSimple(params, allowedBranchIds);

  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE' ${branchSuffix}) AS total_employees,
      (SELECT COUNT(*) FROM employees WHERE status IN ('RESIGNED', 'TERMINATED') ${branchSuffix}) AS total_turnover
  `, params);

  return result.rows[0];
};

const getDailyBreakdown = async (allowedBranchIds = null, startDate = null, endDate = null) => {
  const params = [];
  const branchClause = buildBranchClause(params, allowedBranchIds);
  let dateClause = buildDateClause(params, startDate, endDate);
  if (!startDate && !endDate) {
    dateClause = `AND a.date >= CURRENT_DATE - INTERVAL '7 days'`;
  }

  const result = await pool.query(`
    SELECT 
      a.date,
      COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE a.status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE a.status = 'LEAVE') AS leave
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE (1=1)
      ${branchClause}
      ${dateClause}
    GROUP BY a.date
    ORDER BY a.date
  `, params);

  return result.rows;
};

const getMonthlyComparison = async (allowedBranchIds = null, startDate = null, endDate = null) => {
  const params = [];
  const branchClause = buildBranchClause(params, allowedBranchIds);
  let dateClause = buildDateClause(params, startDate, endDate);
  if (!startDate && !endDate) {
    dateClause = `AND a.date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`;
  }

  const result = await pool.query(`
    SELECT
      DATE_TRUNC('month', a.date) AS month,
      COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE a.status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE a.status = 'LEAVE') AS on_leave
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE (1=1)
      ${branchClause}
      ${dateClause}
    GROUP BY month
    ORDER BY month
  `, params);

  return result.rows;
};

const getWeeklyTrend = async (allowedBranchIds = null, startDate = null, endDate = null) => {
  const params = [];
  const branchClause = buildBranchClause(params, allowedBranchIds);
  let dateClause = buildDateClause(params, startDate, endDate);
  if (!startDate && !endDate) {
    dateClause = `AND a.date >= CURRENT_DATE - INTERVAL '7 days'`;
  }

  const result = await pool.query(`
    SELECT 
      TO_CHAR(a.date, 'Dy') AS day,
      COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE a.status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE a.status = 'LEAVE') AS on_leave,
      EXTRACT(DOW FROM a.date) AS dow
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE (1=1)
      ${branchClause}
      ${dateClause}
    GROUP BY day, dow
    ORDER BY dow
  `, params);

  return result.rows;
};

const getEmployeeGrowth = async (allowedBranchIds = null) => {
  const params = [];
  let branchClause = "";
  if (allowedBranchIds && allowedBranchIds.length > 0) {
    branchClause = `WHERE branch_id = ANY($1::int[])`;
    params.push(allowedBranchIds);
  }

  const result = await pool.query(`
    SELECT 
      month,
      SUM(total) OVER (ORDER BY month) AS total
    FROM (
      SELECT 
        TO_CHAR(hired_date, 'YYYY-MM') AS month,
        COUNT(*) AS total
      FROM employees
      ${branchClause}
      GROUP BY month
    ) t
    ORDER BY month
  `, params);

  return result.rows;
};

const getAbsentTrend = async (allowedBranchIds = null, startDate = null, endDate = null) => {
  const params = [];
  const branchClause = buildBranchClause(params, allowedBranchIds);
  const dateClause = buildDateClause(params, startDate, endDate);

  const result = await pool.query(`
    SELECT 
      TO_CHAR(a.date, 'YYYY-MM') AS month,
      COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE (1=1)
      ${branchClause}
      ${dateClause}
    GROUP BY month
    ORDER BY month
  `, params);

  return result.rows;
};

const getAdminAnalytics = async (allowedBranchIds = null, startDate = null, endDate = null) => {
  const [stats, growth, absent, daily, weekly, monthly] = await Promise.all([
    getAdminStats(allowedBranchIds),
    getEmployeeGrowth(allowedBranchIds),
    getAbsentTrend(allowedBranchIds, startDate, endDate),
    getDailyBreakdown(allowedBranchIds, startDate, endDate),
    getWeeklyTrend(allowedBranchIds, startDate, endDate),
    getMonthlyComparison(allowedBranchIds, startDate, endDate),
  ]);

  return {
    stats,
    employee_growth: growth,
    absent_trend: absent,
    daily_breakdown: daily,
    weekly_trend: weekly,
    monthly_comparison: monthly,
  };
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

const buildPayrollBranchClause = (params, allowedBranchIds) => {
  if (allowedBranchIds && allowedBranchIds.length > 0) {
    return `AND e.branch_id = ANY($${params.length + 1}::int[])`;
  }
  return "";
};

const getPayrollSummary = async (allowedBranchIds = null, startDate = null, endDate = null) => {
  const params = [];
  const branchClause = buildPayrollBranchClause(params, allowedBranchIds);
  const dateClause = buildDateClause(params, startDate, endDate, "p");

  const result = await pool.query(`
    SELECT
      COALESCE(SUM(p.gross_salary), 0) AS total_gross,
      COALESCE(SUM(p.total_deductions), 0) AS total_deductions,
      COALESCE(SUM(p.net_salary), 0) AS total_net,
      COALESCE(SUM(p.overtime_pay), 0) AS total_overtime,
      COUNT(*) AS payroll_count,
      COUNT(*) FILTER (WHERE p.status = 'PAID') AS paid_count
    FROM payroll p
    JOIN employees e ON p.employee_id = e.id
    WHERE (1=1)
      ${branchClause}
      ${dateClause}
  `, params);

  return result.rows[0];
};

const getPayrollTrend = async (allowedBranchIds = null, startDate = null, endDate = null) => {
  const params = [];
  const branchClause = buildPayrollBranchClause(params, allowedBranchIds);
  const dateClause = buildDateClause(params, startDate, endDate, "p");

  const result = await pool.query(`
    SELECT
      TO_CHAR(p.cutoff_start, 'YYYY-MM') AS month,
      COALESCE(SUM(p.gross_salary), 0) AS gross,
      COALESCE(SUM(p.total_deductions), 0) AS deductions,
      COALESCE(SUM(p.net_salary), 0) AS net,
      COALESCE(SUM(p.overtime_pay), 0) AS overtime
    FROM payroll p
    JOIN employees e ON p.employee_id = e.id
    WHERE (1=1)
      ${branchClause}
      ${dateClause}
    GROUP BY month
    ORDER BY month
  `, params);

  return result.rows;
};

const getDeptComparison = async (allowedBranchIds = null, startDate = null, endDate = null) => {
  const params = [];
  const branchClause = buildPayrollBranchClause(params, allowedBranchIds);

  let dateJoinClause = `AND a.date = CURRENT_DATE`;
  if (startDate || endDate) {
    const parts = [];
    if (startDate) {
      parts.push(`a.date >= $${params.length + 1}::date`);
      params.push(startDate);
    }
    if (endDate) {
      parts.push(`a.date <= $${params.length + 1}::date`);
      params.push(endDate);
    }
    dateJoinClause = `AND ${parts.join(" AND ")}`;
  }

  const result = await pool.query(`
    SELECT
      COALESCE(e.department, 'Unassigned') AS department,
      COALESCE(b.name, 'No Branch') AS branch_name,
      COUNT(DISTINCT e.id) AS employee_count,
      COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE a.status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE a.status = 'LEAVE') AS on_leave
    FROM employees e
    LEFT JOIN attendance a ON a.employee_id = e.id
      ${dateJoinClause}
    LEFT JOIN branches b ON b.id = e.branch_id
    WHERE e.status = 'ACTIVE'
      ${branchClause}
    GROUP BY e.department, b.name
    ORDER BY e.department, b.name
  `, params);

  return result.rows;
};

module.exports = {
  getSummary,
  getMySummary,
  getTodayStatus,
  getAdminStats,
  getEmployeeGrowth,
  getAbsentTrend,
  getAdminAnalytics,
  getDailyBreakdown,
  getWeeklyTrend,
  getMonthlyComparison,
  getMyMonthlyComparison,
  getPayrollSummary,
  getPayrollTrend,
  getDeptComparison,
};
