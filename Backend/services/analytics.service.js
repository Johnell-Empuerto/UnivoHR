const pool = require("../config/db");
const anomalyModel = require("../models/anomaly.model");
const forecastService = require("./forecast.service");
const { getUserBranchIds } = require("../utils/branchAccess");

// Reusable analytics API - Phase 4 prep for AI assistant
const getCompanyOverview = async (user) => {
  let allowedBranchIds = null;
  if (user.role === "HR") {
    allowedBranchIds = await getUserBranchIds(user.id);
  }

  const [summary, anomalySummary] = await Promise.all([
    getAttendanceSummary(allowedBranchIds),
    anomalyModel.getAnomalySummary({ allowedBranchIds }),
  ]);

  return {
    attendance: summary,
    anomalies: anomalySummary,
    timestamp: new Date().toISOString(),
  };
};

const getAttendanceSummary = async (allowedBranchIds) => {
  let where = "";
  const params = [];
  if (allowedBranchIds && allowedBranchIds.length > 0) {
    where = `AND e.branch_id = ANY($1::int[])`;
    params.push(allowedBranchIds);
  }

  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE a.status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent,
      COUNT(*) FILTER (WHERE a.status = 'LEAVE') AS on_leave,
      COUNT(*) AS total
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.date = CURRENT_DATE ${where}
  `, params);
  return result.rows[0] || { present: 0, late: 0, absent: 0, on_leave: 0, total: 0 };
};

const getAnomalyTrend = async (days = 30) => {
  const result = await pool.query(`
    SELECT DATE_TRUNC('day', detected_at) AS date,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE severity = 'HIGH') AS high,
           COUNT(*) FILTER (WHERE severity = 'MEDIUM') AS medium,
           COUNT(*) FILTER (WHERE severity = 'LOW') AS low
    FROM anomaly_logs
    WHERE detected_at >= CURRENT_DATE - $1::interval
    GROUP BY DATE_TRUNC('day', detected_at)
    ORDER BY date
  `, [`${days} days`]);
  return result.rows;
};

const getForecastSummary = async () => {
  return await forecastService.getLatestForecasts();
};

const getDepartmentComparison = async (allowedBranchIds) => {
  let where = "";
  const params = [];
  if (allowedBranchIds && allowedBranchIds.length > 0) {
    where = `AND e.branch_id = ANY($1::int[])`;
    params.push(allowedBranchIds);
  }

  const result = await pool.query(`
    SELECT e.branch_id, b.name AS department,
           COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
           COUNT(*) FILTER (WHERE a.status = 'LATE') AS late,
           COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent,
           COUNT(*) FILTER (WHERE a.status = 'LEAVE') AS on_leave
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN branches b ON b.id = e.branch_id
    WHERE a.date = CURRENT_DATE ${where}
    GROUP BY e.branch_id, b.name
    ORDER BY b.name
  `, params);
  return result.rows;
};

module.exports = {
  getCompanyOverview,
  getAttendanceSummary,
  getAnomalyTrend,
  getForecastSummary,
  getDepartmentComparison,
};
