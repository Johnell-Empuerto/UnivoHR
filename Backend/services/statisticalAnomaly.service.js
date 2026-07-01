const pool = require("../config/db");
const anomalyModel = require("../models/anomaly.model");
const notificationService = require("./notification.service");
const notificationRuleService = require("./notificationRule.service");
const logger = require("../utils/logger");

const DEDUP_WINDOW_DAYS = 1;

const getStatRule = async (ruleKey, defaults = {}) => {
  const rule = await notificationRuleService.getRuleByKey(ruleKey);
  return {
    is_enabled: rule?.is_enabled ?? true,
    in_app_enabled: rule?.in_app_enabled ?? true,
    email_enabled: rule?.email_enabled ?? false,
    threshold_count: Number(rule?.threshold_count ?? defaults.threshold_count ?? 0),
    threshold_days: Number(rule?.threshold_days ?? defaults.threshold_days ?? 0),
    threshold_hours: Number(rule?.threshold_hours ?? defaults.threshold_hours ?? 0),
    threshold_percent: Number(rule?.threshold_percent ?? defaults.threshold_percent ?? 0),
  };
};

const shouldSkipDuplicate = async (employeeId, anomalyType, sourceModule) => {
  const since = new Date();
  since.setDate(since.getDate() - DEDUP_WINDOW_DAYS);
  const existing = await anomalyModel.findExistingOpenAnomaly({
    employee_id: employeeId,
    anomaly_type: anomalyType,
    source_module: sourceModule,
    since_date: since.toISOString(),
  });
  return existing !== null;
};

const createStatAnomaly = async (data) => {
  return await anomalyModel.createAnomaly(data);
};

const notifyHighSeverity = async (anomaly) => {
  const adminUsers = await pool.query(
    `SELECT u.id FROM users u WHERE (u.role = 'ADMIN' OR EXISTS (SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_key = 'anomalies.view' AND up.is_allowed = true)) AND u.is_active = true`
  );
  for (const user of adminUsers.rows) {
    try {
      await notificationService.notify({
        user_id: user.id,
        type: "STAT_ANOMALY_HIGH",
        title: anomaly.title,
        message: anomaly.description || anomaly.title,
        reference_id: anomaly.id,
        meta: { anomaly_id: anomaly.id, severity: "HIGH", anomaly_type: anomaly.anomaly_type, statistical_method: anomaly.statistical_method },
      });
    } catch (err) {
      logger.error({ err }, `[StatAnomaly] Notify failed for user ${user.id}`);
    }
  }
};

// ============================================
// STATISTICAL METHODS
// ============================================

const calculateMean = (values) => {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
};

const calculateStdDev = (values, mean) => {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const calculateZScore = (value, mean, stddev) => {
  if (stddev === 0) return 0;
  return (value - mean) / stddev;
};

const calculateMovingAverage = (values, window = 7) => {
  if (values.length < window) return values;
  const result = [];
  for (let i = 0; i <= values.length - window; i++) {
    result.push(values.slice(i, i + window).reduce((s, v) => s + v, 0) / window);
  }
  return result;
};

const mapSeverity = (zScore) => {
  if (Math.abs(zScore) >= 3) return { severity: "HIGH", confidence: Math.min(Math.abs(zScore) / 4, 1) };
  if (Math.abs(zScore) >= 2) return { severity: "MEDIUM", confidence: Math.min(Math.abs(zScore) / 4, 0.99) };
  if (Math.abs(zScore) >= 1.5) return { severity: "LOW", confidence: Math.min(Math.abs(zScore) / 4, 0.8) };
  return null;
};

// ============================================
// STATISTICAL ATTENDANCE ANOMALIES
// ============================================

const detectStatisticalAttendanceAnomalies = async () => {
  const results = { detected: 0, errors: 0 };

  const movingAvgRule = await getStatRule("stat_anomaly_moving_average", { threshold_days: 7 });
  const attendanceRateRule = await getStatRule("stat_anomaly_attendance_rate", { threshold_days: 30 });
  const absenteeismRule = await getStatRule("stat_anomaly_absenteeism_spike", { threshold_count: 2, threshold_days: 7 });

  // Attendance rate drop analysis
  if (attendanceRateRule.is_enabled && movingAvgRule.is_enabled) {
    const dailyRates = await pool.query(`
      SELECT a.date,
             COUNT(*) FILTER (WHERE a.status IN ('PRESENT', 'LATE'))::float / NULLIF(COUNT(*), 0) AS attendance_rate
      FROM attendance a
      WHERE a.date >= CURRENT_DATE - $1::INTEGER
      GROUP BY a.date
      ORDER BY a.date
    `, [attendanceRateRule.threshold_days]);

    if (dailyRates.rows.length >= movingAvgRule.threshold_days) {
      const values = dailyRates.rows.map(r => parseFloat(r.attendance_rate));
      const mean = calculateMean(values);
      const stddev = calculateStdDev(values, mean);
      const latest = values[values.length - 1];
      const zScore = calculateZScore(latest, mean, stddev);
      const scoring = mapSeverity(zScore);

      if (scoring && zScore < 0) {
        const today = dailyRates.rows[dailyRates.rows.length - 1];
        await createStatAnomaly({
          employee_id: 0,
          branch_id: null,
          anomaly_type: "ATTENDANCE_RATE_DROP",
          source_module: "attendance",
          severity: scoring.severity,
          title: "Statistical Attendance Rate Drop",
          description: `Attendance rate dropped to ${(latest * 100).toFixed(1)}% (Z=${zScore.toFixed(2)}, σ=${stddev.toFixed(3)})`,
          detected_value: `${(latest * 100).toFixed(1)}%`,
          expected_value: `${(mean * 100).toFixed(1)}% avg`,
          metadata: { z_score: zScore, mean, stddev, date: today.date, sample_size: values.length },
          anomaly_score: Math.abs(zScore),
          confidence: scoring.confidence,
          baseline_value: `${(mean * 100).toFixed(1)}%`,
          statistical_method: "ZSCORE",
        });
        results.detected++;
      }
    }
  }

  // Per-employee: check for sudden absenteeism increase
  if (absenteeismRule.is_enabled) {
    const empAbsence = await pool.query(`
      SELECT a.employee_id, e.branch_id,
             COUNT(*) FILTER (WHERE a.status = 'ABSENT' AND a.date >= CURRENT_DATE - $1::INTEGER) AS recent_absences,
             COUNT(*) FILTER (WHERE a.status = 'ABSENT' AND a.date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE - ($1 + 1)::INTEGER) AS prior_absences
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY a.employee_id, e.branch_id
      HAVING COUNT(*) FILTER (WHERE a.status = 'ABSENT' AND a.date >= CURRENT_DATE - $1::INTEGER) >
             GREATEST(COUNT(*) FILTER (WHERE a.status = 'ABSENT' AND a.date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE - ($1 + 1)::INTEGER), 0) + $2
    `, [absenteeismRule.threshold_days, absenteeismRule.threshold_count]);

    for (const row of empAbsence.rows) {
    const recent = parseInt(row.recent_absences);
    const prior = parseInt(row.prior_absences);
    if (await shouldSkipDuplicate(row.employee_id, "STAT_ABSENTEEISM_SPIKE", "attendance")) continue;
    const spike = prior > 0 ? ((recent - prior) / prior) * 100 : 999;
    const severity = spike > 200 ? "HIGH" : spike > 100 ? "MEDIUM" : "LOW";
    const confidence = Math.min(spike / 300, 1);
    await createStatAnomaly({
      employee_id: row.employee_id,
      branch_id: row.branch_id,
      anomaly_type: "STAT_ABSENTEEISM_SPIKE",
      source_module: "attendance",
      severity,
      title: "Statistical Absenteeism Spike",
      description: `Employee was absent ${recent}x in last 7 days vs ${prior}x in previous 21 days (${spike.toFixed(0)}% increase)`,
      detected_value: `${recent} absences`,
      expected_value: `${prior} absences (baseline)`,
      metadata: { recent_absences: recent, prior_absences: prior, spike_percent: spike },
      anomaly_score: spike / 100,
      confidence,
      baseline_value: String(prior),
      statistical_method: "BASELINE_COMPARISON",
    });
    results.detected++;
    }
  }

  return results;
};

// ============================================
// STATISTICAL PAYROLL ANOMALIES
// ============================================

const detectStatisticalPayrollAnomalies = async () => {
  const results = { detected: 0, errors: 0 };

  const cutoffData = await pool.query(`
    SELECT DISTINCT cutoff_start, cutoff_end FROM payroll WHERE status IN ('PAID', 'UNPAID') ORDER BY cutoff_end DESC LIMIT 6
  `);
  if (cutoffData.rows.length < 3) return results;

  const recentCutoffs = cutoffData.rows;
  // Check each employee's payroll across last N cutoffs for z-score outliers
  for (let i = 0; i < Math.min(recentCutoffs.length, 3); i++) {
    const cutoff = recentCutoffs[i];
    const payrolls = await pool.query(`
      SELECT p.employee_id, e.branch_id, p.net_salary,
        (SELECT AVG(p2.net_salary) FROM payroll p2 WHERE p2.employee_id = p.employee_id AND p2.status IN ('PAID', 'UNPAID') AND p2.id != p.id) AS avg_salary
      FROM payroll p
      JOIN employees e ON e.id = p.employee_id
      WHERE p.cutoff_start = $1::date AND p.cutoff_end = $2::date AND p.net_salary > 0
    `, [cutoff.cutoff_start, cutoff.cutoff_end]);

    for (const row of payrolls.rows) {
      const avg = parseFloat(row.avg_salary || 0);
      if (avg <= 0) continue;
      const current = parseFloat(row.net_salary);
      const ratio = current / avg;
      const zScore = (ratio - 1) / 0.15;
      const scoring = mapSeverity(zScore);

      if (scoring && Math.abs(zScore) > 2) {
        if (await shouldSkipDuplicate(row.employee_id, "STAT_PAYROLL_OUTLIER", "payroll")) continue;
        await createStatAnomaly({
          employee_id: row.employee_id,
          branch_id: row.branch_id,
          anomaly_type: "STAT_PAYROLL_OUTLIER",
          source_module: "payroll",
          severity: scoring.severity,
          title: "Statistical Payroll Outlier",
          description: `Net salary ${current.toFixed(2)} is ${(zScore > 0 ? "above" : "below")} historical avg of ${avg.toFixed(2)} (Z=${zScore.toFixed(2)})`,
          detected_value: current.toFixed(2),
          expected_value: avg.toFixed(2),
          metadata: { cutoff_start: cutoff.cutoff_start, cutoff_end: cutoff.cutoff_end, z_score: zScore, avg, current },
          anomaly_score: Math.abs(zScore),
          confidence: scoring.confidence,
          baseline_value: avg.toFixed(2),
          statistical_method: "ZSCORE",
        });
        results.detected++;
      }
    }
  }

  return results;
};

// ============================================
// STATISTICAL OVERTIME ANOMALIES
// ============================================

const detectStatisticalOvertimeAnomalies = async () => {
  const results = { detected: 0, errors: 0 };

  const otHistoryRule = await getStatRule("stat_anomaly_overtime_history", { threshold_days: 60 });
  if (!otHistoryRule.is_enabled) return results;

  const weeklyOT = await pool.query(`
    SELECT o.employee_id, e.branch_id, DATE_TRUNC('week', o.date) AS week, SUM(o.hours) AS total_hours
    FROM overtime_requests o
    JOIN employees e ON e.id = o.employee_id
    WHERE o.status = 'APPROVED' AND o.date >= CURRENT_DATE - $1::INTEGER
    GROUP BY o.employee_id, e.branch_id, DATE_TRUNC('week', o.date)
    ORDER BY o.employee_id, week
  `, [otHistoryRule.threshold_days]);

  const empMap = {};
  for (const row of weeklyOT.rows) {
    const key = row.employee_id;
    if (!empMap[key]) empMap[key] = { branch_id: row.branch_id, weeks: [] };
    empMap[key].weeks.push(parseFloat(row.total_hours));
  }

  for (const [empId, data] of Object.entries(empMap)) {
    if (data.weeks.length < 4) continue;
    const mean = calculateMean(data.weeks);
    const stddev = calculateStdDev(data.weeks, mean);
    const latest = data.weeks[data.weeks.length - 1];
    const zScore = calculateZScore(latest, mean, stddev);
    const scoring = mapSeverity(zScore);

    if (scoring && zScore > 1.5) {
      if (await shouldSkipDuplicate(parseInt(empId), "STAT_OVERTIME_SPIKE", "overtime")) continue;
      await createStatAnomaly({
        employee_id: parseInt(empId),
        branch_id: data.branch_id,
        anomaly_type: "STAT_OVERTIME_SPIKE",
        source_module: "overtime",
        severity: scoring.severity,
        title: "Statistical Overtime Spike",
        description: `Weekly OT ${latest.toFixed(1)}h deviates from avg ${mean.toFixed(1)}h (Z=${zScore.toFixed(2)})`,
        detected_value: `${latest.toFixed(1)}h`,
        expected_value: `${mean.toFixed(1)}h avg`,
        metadata: { weekly_hours: latest, mean, stddev, z_score: zScore, weeks_sampled: data.weeks.length },
        anomaly_score: Math.abs(zScore),
        confidence: scoring.confidence,
        baseline_value: `${mean.toFixed(1)}h`,
        statistical_method: "ZSCORE",
      });
      results.detected++;
    }
  }

  return results;
};

// ============================================
// STATISTICAL LEAVE ANOMALIES
// ============================================

const detectStatisticalLeaveAnomalies = async () => {
  const results = { detected: 0, errors: 0 };

  const leaveFreqRule = await getStatRule("stat_anomaly_leave_frequency", { threshold_count: 90, threshold_days: 30 });
  if (!leaveFreqRule.is_enabled) return results;

  const leaveFreq = await pool.query(`
    SELECT l.employee_id, e.branch_id, COUNT(*) AS leave_count,
      (SELECT COUNT(*) FROM leaves l2 WHERE l2.employee_id = l.employee_id AND l2.created_at BETWEEN CURRENT_DATE - $2::INTEGER AND CURRENT_DATE - ($1 + 1)::INTEGER) AS historical_count
    FROM leaves l
    JOIN employees e ON e.id = l.employee_id
    WHERE l.created_at >= CURRENT_DATE - $1::INTEGER
      AND l.status IN ('APPROVED', 'PENDING')
    GROUP BY l.employee_id, e.branch_id
  `, [leaveFreqRule.threshold_days, leaveFreqRule.threshold_count]);

  for (const row of leaveFreq.rows) {
    const recent = parseInt(row.leave_count);
    const hist = parseInt(row.historical_count);
    if (hist < 1) continue;
    const ratio = recent / (hist / 3);
    if (ratio > 2) {
      if (await shouldSkipDuplicate(row.employee_id, "STAT_LEAVE_FREQUENCY_SPIKE", "leaves")) continue;
      const severity = ratio > 4 ? "HIGH" : "MEDIUM";
      await createStatAnomaly({
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "STAT_LEAVE_FREQUENCY_SPIKE",
        source_module: "leaves",
        severity,
        title: "Statistical Leave Frequency Spike",
        description: `Leave requests ${recent}x in 30d vs historical ${(hist / 3).toFixed(1)}x monthly avg`,
        detected_value: `${recent} requests`,
        expected_value: `${(hist / 3).toFixed(1)} requests`,
        metadata: { recent_30d: recent, historical_90d: hist, ratio },
        anomaly_score: ratio,
        confidence: Math.min(ratio / 5, 1),
        baseline_value: `${(hist / 3).toFixed(1)} avg`,
        statistical_method: "HISTORICAL_RATIO",
      });
      results.detected++;
    }
  }

  return results;
};

// ============================================
// BRANCH-LEVEL ANOMALIES
// ============================================

const detectStatisticalBranchAnomalies = async () => {
  const results = { detected: 0, errors: 0 };

  const branchAbsence = await pool.query(`
    SELECT e.branch_id, b.name AS branch_name, COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absences, COUNT(*) AS total
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN branches b ON b.id = e.branch_id
    WHERE a.date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY e.branch_id, b.name
  `);

  const rates = branchAbsence.rows.map(r => ({
    ...r,
    rate: r.total > 0 ? parseInt(r.absences) / parseInt(r.total) : 0,
  }));

  if (rates.length >= 3) {
    const values = rates.map(r => r.rate);
    const mean = calculateMean(values);
    const stddev = calculateStdDev(values, mean);

    for (const row of rates) {
      const zScore = calculateZScore(row.rate, mean, stddev);
      const scoring = mapSeverity(zScore);
      if (scoring && zScore > 1.5) {
        if (await shouldSkipDuplicate(-row.branch_id, "STAT_BRANCH_HIGH_ABSENCE", "attendance")) continue;
        await createStatAnomaly({
          employee_id: 0,
          branch_id: row.branch_id,
          anomaly_type: "STAT_BRANCH_HIGH_ABSENCE",
          source_module: "attendance",
          severity: scoring.severity,
          title: `Statistical Branch Absence Spike: ${row.branch_name}`,
          description: `Branch absence rate ${(row.rate * 100).toFixed(1)}% exceeds norm by ${(Math.abs(zScore) * stddev * 100).toFixed(1)}%`,
          detected_value: `${(row.rate * 100).toFixed(1)}%`,
          expected_value: `${(mean * 100).toFixed(1)}% avg`,
          metadata: { branch_id: row.branch_id, branch_name: row.branch_name, rate: row.rate, z_score: zScore, mean, stddev },
          anomaly_score: Math.abs(zScore),
          confidence: scoring.confidence,
          baseline_value: `${(mean * 100).toFixed(1)}%`,
          statistical_method: "ZSCORE_CROSS_BRANCH",
        });
        results.detected++;
      }
    }
  }

  return results;
};

// ============================================
// SCAN RUNNERS
// ============================================

const runDailyStatisticalScan = async () => {
  logger.info("[StatAnomalyScan] Starting daily statistical scan...");
  const results = {
    attendance: { detected: 0, errors: 0 },
    overtime: { detected: 0, errors: 0 },
    leaves: { detected: 0, errors: 0 },
    branch: { detected: 0, errors: 0 },
    total_detected: 0,
  };

  try { results.attendance = await detectStatisticalAttendanceAnomalies(); }
  catch (err) { logger.error({ err }, "[StatAnomalyScan] Attendance"); results.attendance.errors = 1; }

  try { results.overtime = await detectStatisticalOvertimeAnomalies(); }
  catch (err) { logger.error({ err }, "[StatAnomalyScan] Overtime"); results.overtime.errors = 1; }

  try { results.leaves = await detectStatisticalLeaveAnomalies(); }
  catch (err) { logger.error({ err }, "[StatAnomalyScan] Leaves"); results.leaves.errors = 1; }

  try { results.branch = await detectStatisticalBranchAnomalies(); }
  catch (err) { logger.error({ err }, "[StatAnomalyScan] Branch"); results.branch.errors = 1; }

  results.total_detected = results.attendance.detected + results.overtime.detected +
    results.leaves.detected + results.branch.detected;
  logger.info(`[StatAnomalyScan] Daily stat scan complete. ${results.total_detected} anomalies.`);
  return results;
};

const runWeeklyStatisticalScan = async () => {
  logger.info("[StatAnomalyScan] Starting weekly statistical scan...");
  const results = {
    payroll: { detected: 0, errors: 0 },
    total_detected: 0,
  };

  try { results.payroll = await detectStatisticalPayrollAnomalies(); }
  catch (err) { logger.error({ err }, "[StatAnomalyScan] Payroll"); results.payroll.errors = 1; }

  results.total_detected = results.payroll.detected;
  logger.info(`[StatAnomalyScan] Weekly stat scan complete. ${results.total_detected} anomalies.`);
  return results;
};

module.exports = {
  detectStatisticalAttendanceAnomalies,
  detectStatisticalPayrollAnomalies,
  detectStatisticalOvertimeAnomalies,
  detectStatisticalLeaveAnomalies,
  detectStatisticalBranchAnomalies,
  runDailyStatisticalScan,
  runWeeklyStatisticalScan,
};
