const pool = require("../config/db");
const logger = require("../utils/logger");

// ============================================
// MOVING AVERAGE FORECASTING
// ============================================

const movingAverage = (values, window = 7) => {
  if (values.length < window) return values.length > 0 ? calculateMean(values) : 0;
  const recent = values.slice(-window);
  return recent.reduce((s, v) => s + v, 0) / window;
};

const calculateMean = (values) => {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
};

const calculateStdDev = (values, mean) => {
  if (values.length < 2) return 0;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
};

const linearRegression = (values) => {
  const n = values.length;
  if (n < 3) return { slope: 0, intercept: 0, r2: 0 };
  const xMean = (n - 1) / 2;
  const yMean = calculateMean(values);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * i;
    ssRes += (values[i] - pred) ** 2;
    ssTot += (values[i] - yMean) ** 2;
  }
  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;
  return { slope, intercept, r2 };
};

const predictNext = (values, method = "MOVING_AVERAGE", window = 7) => {
  if (!values.length) return { predicted: 0, confidence: 0, method };

  if (method === "MOVING_AVERAGE") {
    const predicted = movingAverage(values, window);
    const mean = calculateMean(values);
    const stddev = calculateStdDev(values, mean);
    const confidence = stddev > 0 ? Math.max(0, 1 - stddev / Math.max(mean, 0.01)) : 0.5;
    return { predicted: Math.round(predicted * 100) / 100, confidence: Math.min(confidence, 0.99), method };
  }

  if (method === "LINEAR_REGRESSION") {
    const { slope, intercept, r2 } = linearRegression(values);
    const predicted = intercept + slope * values.length;
    return { predicted: Math.max(0, Math.round(predicted * 100) / 100), confidence: Math.max(0, Math.min(r2, 0.99)), method };
  }

  if (method === "TREND_EXTRAPOLATION") {
    const ma = movingAverage(values, window);
    const { slope } = linearRegression(values);
    const predicted = ma + slope;
    return { predicted: Math.max(0, Math.round(predicted * 100) / 100), confidence: 0.5, method };
  }

  return { predicted: 0, confidence: 0, method };
};

const saveForecast = async ({ metric_name, branch_id, department, predicted_value, confidence, forecast_date, period_type, method, metadata }) => {
  const result = await pool.query(`
    INSERT INTO forecast_logs (metric_name, branch_id, department, predicted_value, confidence, forecast_date, period_type, method, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [metric_name, branch_id || null, department || null, predicted_value, confidence || null, forecast_date, period_type, method, JSON.stringify(metadata || {})]);
  return result.rows[0];
};

const updateActualValue = async (id, actual_value) => {
  const result = await pool.query(`UPDATE forecast_logs SET actual_value = $1 WHERE id = $2 RETURNING *`, [actual_value, id]);
  return result.rows[0];
};

// ============================================
// ATTENDANCE FORECAST
// ============================================

const forecastAttendance = async ({ branch_id = null, department = null } = {}) => {
  const results = [];
  const params = [];
  let where = "";
  let idx = 1;

  if (branch_id) { where += ` AND e.branch_id = $${idx++}`; params.push(branch_id); }

  const dailyRates = await pool.query(`
    SELECT a.date,
           COUNT(*) FILTER (WHERE a.status IN ('PRESENT', 'LATE'))::float / NULLIF(COUNT(*), 0) AS rate
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.date >= CURRENT_DATE - INTERVAL '60 days' ${where}
    GROUP BY a.date ORDER BY a.date
  `, params);

  if (dailyRates.rows.length < 7) return results;

  const rates = dailyRates.rows.map(r => parseFloat(r.rate));
  const weekly = [];
  for (let i = 0; i < rates.length; i += 7) {
    weekly.push(calculateMean(rates.slice(i, Math.min(i + 7, rates.length))));
  }

  const forecast = predictNext(weekly, "MOVING_AVERAGE", 4);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const saved = await saveForecast({
    metric_name: "attendance_rate",
    branch_id,
    department,
    predicted_value: forecast.predicted * 100,
    confidence: forecast.confidence,
    forecast_date: nextWeek.toISOString().split("T")[0],
    period_type: "WEEKLY",
    method: forecast.method,
    metadata: { samples: rates.length, weekly_samples: weekly.length, last_30d_avg: calculateMean(rates.slice(-30)) * 100 },
  });

  results.push(saved);

  // Monthly forecast
  const monthly = predictNext(weekly, "LINEAR_REGRESSION");
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  const savedMonthly = await saveForecast({
    metric_name: "attendance_rate",
    branch_id,
    department,
    predicted_value: monthly.predicted * 100,
    confidence: monthly.confidence,
    forecast_date: nextMonth.toISOString().split("T")[0],
    period_type: "MONTHLY",
    method: monthly.method,
    metadata: { samples: rates.length, weekly_samples: weekly.length },
  });
  results.push(savedMonthly);

  return results;
};

// ============================================
// PAYROLL FORECAST
// ============================================

const forecastPayroll = async ({ branch_id = null } = {}) => {
  const results = [];
  const params = [];
  let where = "";
  let idx = 1;
  if (branch_id) { where += ` AND e.branch_id = $${idx++}`; params.push(branch_id); }

  const payrollData = await pool.query(`
    SELECT p.cutoff_end, SUM(p.net_salary) AS total_payroll
    FROM payroll p
    JOIN employees e ON e.id = p.employee_id
    WHERE p.status IN ('PAID', 'UNPAID') ${where}
    GROUP BY p.cutoff_end ORDER BY p.cutoff_end DESC LIMIT 12
  `, params);

  if (payrollData.rows.length < 3) return results;

  const values = payrollData.rows.map(r => parseFloat(r.total_payroll)).reverse();
  const forecast = predictNext(values, "LINEAR_REGRESSION");
  const nextCutoff = new Date(payrollData.rows[0].cutoff_end);
  nextCutoff.setDate(nextCutoff.getDate() + 14);

  const saved = await saveForecast({
    metric_name: "payroll_cost",
    branch_id,
    department: null,
    predicted_value: forecast.predicted,
    confidence: forecast.confidence,
    forecast_date: nextCutoff.toISOString().split("T")[0],
    period_type: "CUTOFF",
    method: forecast.method,
    metadata: { samples: values.length, last_total: values[values.length - 1] },
  });
  results.push(saved);

  return results;
};

// ============================================
// OVERTIME FORECAST
// ============================================

const forecastOvertime = async ({ branch_id = null } = {}) => {
  const results = [];
  const params = [];
  let where = "";
  let idx = 1;
  if (branch_id) { where += ` AND e.branch_id = $${idx++}`; params.push(branch_id); }

  const weeklyOT = await pool.query(`
    SELECT DATE_TRUNC('week', o.date) AS week, SUM(o.hours)::float AS total_hours
    FROM overtime_requests o
    JOIN employees e ON e.id = o.employee_id
    WHERE o.status = 'APPROVED' AND o.date >= CURRENT_DATE - INTERVAL '90 days' ${where}
    GROUP BY week ORDER BY week
  `, params);

  if (weeklyOT.rows.length < 4) return results;

  const values = weeklyOT.rows.map(r => r.total_hours);
  const forecast = predictNext(values, "TREND_EXTRAPOLATION", 4);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const saved = await saveForecast({
    metric_name: "overtime_hours",
    branch_id,
    department: null,
    predicted_value: forecast.predicted,
    confidence: forecast.confidence,
    forecast_date: nextWeek.toISOString().split("T")[0],
    period_type: "WEEKLY",
    method: forecast.method,
    metadata: { samples: values.length, weekly_avg: calculateMean(values) },
  });
  results.push(saved);

  return results;
};

// ============================================
// ABSENTEEISM FORECAST
// ============================================

const forecastAbsenteeism = async ({ branch_id = null } = {}) => {
  const results = [];
  const params = [];
  let where = "";
  let idx = 1;
  if (branch_id) { where += ` AND e.branch_id = $${idx++}`; params.push(branch_id); }

  const weeklyAbsence = await pool.query(`
    SELECT DATE_TRUNC('week', a.date) AS week,
           COUNT(*) FILTER (WHERE a.status = 'ABSENT')::float / NULLIF(COUNT(*), 0) AS absence_rate
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.date >= CURRENT_DATE - INTERVAL '90 days' ${where}
    GROUP BY week ORDER BY week
  `, params);

  if (weeklyAbsence.rows.length < 4) return results;

  const values = weeklyAbsence.rows.map(r => parseFloat(r.absence_rate));
  const forecast = predictNext(values, "MOVING_AVERAGE", 4);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const saved = await saveForecast({
    metric_name: "absenteeism_rate",
    branch_id,
    department: null,
    predicted_value: forecast.predicted * 100,
    confidence: forecast.confidence,
    forecast_date: nextWeek.toISOString().split("T")[0],
    period_type: "WEEKLY",
    method: forecast.method,
    metadata: { samples: values.length, current_rate: values[values.length - 1] * 100 },
  });
  results.push(saved);

  return results;
};

// ============================================
// FORECAST HISTORY
// ============================================

const getForecastHistory = async ({ metric_name, branch_id, period_type, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (metric_name) { conditions.push(`metric_name = $${idx++}`); params.push(metric_name); }
  if (branch_id) { conditions.push(`branch_id = $${idx++}`); params.push(branch_id); }
  if (period_type) { conditions.push(`period_type = $${idx++}`); params.push(period_type); }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const data = await pool.query(`
    SELECT * FROM forecast_logs ${where} ORDER BY forecast_date DESC LIMIT $${idx++} OFFSET $${idx++}
  `, [...params, limit, offset]);

  const count = await pool.query(`SELECT COUNT(*) FROM forecast_logs ${where}`, params);
  const total = parseInt(count.rows[0].count);

  return {
    data: data.rows,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getLatestForecasts = async ({ metric_name, branch_id } = {}) => {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (metric_name) { conditions.push(`metric_name = $${idx++}`); params.push(metric_name); }
  if (branch_id) { conditions.push(`branch_id = $${idx++}`); params.push(branch_id); }
  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const result = await pool.query(`
    SELECT DISTINCT ON (metric_name, period_type) *
    FROM forecast_logs ${where}
    ORDER BY metric_name, period_type, forecast_date DESC
  `, params);
  return result.rows;
};

const getForecastAccuracy = async ({ metric_name, branch_id, period_type } = {}) => {
  const conditions = ["actual_value IS NOT NULL"];
  const params = [];
  let idx = 1;
  if (metric_name) { conditions.push(`metric_name = $${idx++}`); params.push(metric_name); }
  if (branch_id) { conditions.push(`branch_id = $${idx++}`); params.push(branch_id); }
  if (period_type) { conditions.push(`period_type = $${idx++}`); params.push(period_type); }
  const where = "WHERE " + conditions.join(" AND ");

  const result = await pool.query(`
    SELECT metric_name, period_type,
           COUNT(*) AS total,
           AVG(1 - ABS(predicted_value - actual_value) / NULLIF(GREATEST(predicted_value, actual_value), 0)) AS avg_accuracy
    FROM forecast_logs ${where}
    GROUP BY metric_name, period_type
  `, params);
  return result.rows;
};

const runAllForecasts = async () => {
  const results = { attendance: [], payroll: [], overtime: [], absenteeism: [], errors: [] };

  try { results.attendance = await forecastAttendance(); }
  catch (err) { results.errors.push(`Attendance: ${err.message}`); }

  try { results.payroll = await forecastPayroll(); }
  catch (err) { results.errors.push(`Payroll: ${err.message}`); }

  try { results.overtime = await forecastOvertime(); }
  catch (err) { results.errors.push(`Overtime: ${err.message}`); }

  try { results.absenteeism = await forecastAbsenteeism(); }
  catch (err) { results.errors.push(`Absenteeism: ${err.message}`); }

  logger.info(`[Forecast] All forecasts generated. Attendance:${results.attendance.length} Payroll:${results.payroll.length} OT:${results.overtime.length} Abs:${results.absenteeism.length}`);
  return results;
};

// Branch-level forecasting
const forecastByBranch = async () => {
  const branches = await pool.query(`SELECT id, name FROM branches WHERE is_active = true`);
  const results = [];
  for (const branch of branches.rows) {
    try {
      const att = await forecastAttendance({ branch_id: branch.id });
      const pay = await forecastPayroll({ branch_id: branch.id });
      const ot = await forecastOvertime({ branch_id: branch.id });
      const abs = await forecastAbsenteeism({ branch_id: branch.id });
      results.push({ branch_id: branch.id, branch_name: branch.name, attendance: att.length, payroll: pay.length, overtime: ot.length, absenteeism: abs.length });
    } catch (err) {
      logger.error({ err }, `[Forecast] Branch ${branch.name} failed`);
    }
  }
  return results;
};

module.exports = {
  forecastAttendance,
  forecastPayroll,
  forecastOvertime,
  forecastAbsenteeism,
  getForecastHistory,
  getLatestForecasts,
  getForecastAccuracy,
  runAllForecasts,
  forecastByBranch,
  updateActualValue,
};
