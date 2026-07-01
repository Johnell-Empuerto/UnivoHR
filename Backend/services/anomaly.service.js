const pool = require("../config/db");
const anomalyModel = require("../models/anomaly.model");
const notificationService = require("./notification.service");
const auditService = require("./audit.service");
const notificationRuleService = require("./notificationRule.service");
const logger = require("../utils/logger");

const DEDUP_WINDOW_DAYS = 1;

const getAnomalyRule = async (ruleKey, defaults = {}) => {
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

const createAnomalyRecord = async (req, anomalyData) => {
  const anomaly = await anomalyModel.createAnomaly(anomalyData);

  await auditService.auditLog(req, {
    action: "ANOMALY_CREATED",
    table_name: "anomaly_logs",
    record_id: anomaly.id,
    employee_id: anomalyData.employee_id,
    branch_id: anomalyData.branch_id,
    new_values: anomalyData,
    description: `Anomaly detected: ${anomalyData.title} (${anomalyData.severity})`,
  });

  if (anomalyData.severity === "HIGH") {
    try {
      await notifyHighSeverityAnomaly(anomaly);
    } catch (err) {
      logger.error({ err }, "[Anomaly] Failed to send HIGH severity notification");
    }
  }

  return anomaly;
};

const notifyHighSeverityAnomaly = async (anomaly) => {
  const adminUsers = await pool.query(
    `SELECT u.id FROM users u WHERE (u.role = 'ADMIN' OR EXISTS (SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.permission_key = 'anomalies.view' AND up.is_allowed = true)) AND u.is_active = true`
  );

  for (const user of adminUsers.rows) {
    try {
      await notificationService.notify({
        user_id: user.id,
        type: "ANOMALY_HIGH",
        title: anomaly.title,
        message: anomaly.description || anomaly.title,
        reference_id: anomaly.id,
        meta: { anomaly_id: anomaly.id, severity: "HIGH", anomaly_type: anomaly.anomaly_type },
      });
    } catch (err) {
      logger.error({ err }, `[Anomaly] Failed to notify user ${user.id}`);
    }
  }
};

// ============================================
// ATTENDANCE RULES
// ============================================

const detectAttendanceAnomalies = async (req) => {
  const results = { detected: 0, errors: 0 };

  // 1. Repeated late: threshold_count+ times in threshold_days days
  const lateRule = await getAnomalyRule("anomaly_late", { threshold_count: 3, threshold_days: 7 });
  if (lateRule.is_enabled) {
    const repeatedLate = await pool.query(`
      SELECT
        a.employee_id,
        e.branch_id,
        COUNT(*) AS late_count
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.status = 'LATE'
        AND a.date >= CURRENT_DATE - $1::INTEGER
        AND a.date <= CURRENT_DATE
      GROUP BY a.employee_id, e.branch_id
      HAVING COUNT(*) >= $2
    `, [lateRule.threshold_days, lateRule.threshold_count]);

    for (const row of repeatedLate.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "REPEATED_LATE", "attendance")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "REPEATED_LATE",
        source_module: "attendance",
        severity: "MEDIUM",
        title: "Repeated Late Attendance",
        description: `Employee was late ${row.late_count} times in the last ${lateRule.threshold_days} days`,
        detected_value: String(row.late_count),
        expected_value: `Less than ${lateRule.threshold_count} times`,
        metadata: { late_count: parseInt(row.late_count), window_days: lateRule.threshold_days },
      });
      results.detected++;
    }
  }

  // 2. Absent without approved leave today
  const absentWithoutLeave = await pool.query(`
    SELECT
      a.employee_id,
      e.branch_id
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.date = CURRENT_DATE
      AND a.status = 'ABSENT'
      AND NOT EXISTS (
        SELECT 1 FROM leaves l
        WHERE l.employee_id = a.employee_id
          AND l.status = 'APPROVED'
          AND CURRENT_DATE BETWEEN l.from_date AND l.to_date
      )
  `);

  for (const row of absentWithoutLeave.rows) {
    if (await shouldSkipDuplicate(row.employee_id, "ABSENT_WITHOUT_LEAVE", "attendance")) continue;
    await createAnomalyRecord(req, {
      employee_id: row.employee_id,
      branch_id: row.branch_id,
      anomaly_type: "ABSENT_WITHOUT_LEAVE",
      source_module: "attendance",
      severity: "HIGH",
      title: "Absent Without Approved Leave",
      description: "Employee is marked absent today with no approved leave request",
      metadata: { date: new Date().toISOString().split("T")[0] },
    });
    results.detected++;
  }

  // 3. Missing checkout threshold_count+ times in threshold_days days
  const missingCheckoutRule = await getAnomalyRule("anomaly_missing_checkout", { threshold_count: 3, threshold_days: 7 });
  if (missingCheckoutRule.is_enabled) {
    const missingCheckout = await pool.query(`
      SELECT
        a.employee_id,
        e.branch_id,
        COUNT(*) AS missing_count
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.check_out_time IS NULL
        AND a.check_in_time IS NOT NULL
        AND a.date >= CURRENT_DATE - $1::INTEGER
        AND a.date < CURRENT_DATE
      GROUP BY a.employee_id, e.branch_id
      HAVING COUNT(*) >= $2
    `, [missingCheckoutRule.threshold_days, missingCheckoutRule.threshold_count]);

    for (const row of missingCheckout.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "REPEATED_MISSING_CHECKOUT", "attendance")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "REPEATED_MISSING_CHECKOUT",
        source_module: "attendance",
        severity: "MEDIUM",
        title: "Repeated Missing Checkout",
        description: `Employee forgot to check out ${row.missing_count} times in the last ${missingCheckoutRule.threshold_days} days`,
        detected_value: String(row.missing_count),
        expected_value: `Less than ${missingCheckoutRule.threshold_count} times`,
        metadata: { missing_count: parseInt(row.missing_count), window_days: missingCheckoutRule.threshold_days },
      });
      results.detected++;
    }
  }

  // 4. Checkout without check-in
  const checkoutNoCheckin = await pool.query(`
    SELECT
      a.employee_id,
      e.branch_id
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.check_in_time IS NULL
      AND a.check_out_time IS NOT NULL
      AND a.date = CURRENT_DATE
  `);

  for (const row of checkoutNoCheckin.rows) {
    if (await shouldSkipDuplicate(row.employee_id, "CHECKOUT_WITHOUT_CHECKIN", "attendance")) continue;
    await createAnomalyRecord(req, {
      employee_id: row.employee_id,
      branch_id: row.branch_id,
      anomaly_type: "CHECKOUT_WITHOUT_CHECKIN",
      source_module: "attendance",
      severity: "HIGH",
      title: "Checkout Without Check-In",
      description: "Employee has a checkout record but no check-in for today",
      metadata: { date: new Date().toISOString().split("T")[0] },
    });
    results.detected++;
  }

  // 5. Undertime threshold_count+ times in threshold_days days
  const undertimeRule = await getAnomalyRule("anomaly_undertime", { threshold_count: 3, threshold_days: 7 });
  if (undertimeRule.is_enabled) {
    const undertimeRecords = await pool.query(`
      SELECT
        a.employee_id,
        e.branch_id,
        COUNT(*) AS undertime_count
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.status = 'HALF_DAY'
        AND a.date >= CURRENT_DATE - $1::INTEGER
        AND a.date <= CURRENT_DATE
      GROUP BY a.employee_id, e.branch_id
      HAVING COUNT(*) >= $2
    `, [undertimeRule.threshold_days, undertimeRule.threshold_count]);

    for (const row of undertimeRecords.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "FREQUENT_UNDERTIME", "attendance")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "FREQUENT_UNDERTIME",
        source_module: "attendance",
        severity: "MEDIUM",
        title: "Frequent Undertime",
        description: `Employee had undertime (HALF_DAY) ${row.undertime_count} times in the last ${undertimeRule.threshold_days} days`,
        detected_value: String(row.undertime_count),
        expected_value: `Less than ${undertimeRule.threshold_count} times`,
        metadata: { undertime_count: parseInt(row.undertime_count), window_days: undertimeRule.threshold_days },
      });
      results.detected++;
    }
  }

  return results;
};

// ============================================
// OVERTIME RULES
// ============================================

const detectOvertimeAnomalies = async (req) => {
  const results = { detected: 0, errors: 0 };

  // 1. Overtime > threshold_hours hours in one day
  const dailyOtRule = await getAnomalyRule("anomaly_excessive_daily_ot", { threshold_hours: 4 });
  if (dailyOtRule.is_enabled) {
    const excessiveDaily = await pool.query(`
      SELECT
        o.employee_id,
        e.branch_id,
        o.date,
        o.hours
      FROM overtime_requests o
      JOIN employees e ON e.id = o.employee_id
      WHERE o.status = 'APPROVED'
        AND o.hours > $1
        AND o.date >= CURRENT_DATE - INTERVAL '7 days'
    `, [dailyOtRule.threshold_hours]);

    for (const row of excessiveDaily.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "EXCESSIVE_OVERTIME", "overtime")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "EXCESSIVE_OVERTIME",
        source_module: "overtime",
        severity: "MEDIUM",
        title: "Excessive Daily Overtime",
        description: `Employee worked ${row.hours} hours of overtime on ${row.date.toISOString().split("T")[0]}`,
        detected_value: `${row.hours} hours`,
        expected_value: `${dailyOtRule.threshold_hours} hours or less per day`,
        metadata: { date: row.date, hours: parseFloat(row.hours) },
      });
      results.detected++;
    }
  }

  // 2. Overtime > threshold_hours hours in one week
  const weeklyOtRule = await getAnomalyRule("anomaly_excessive_weekly_ot", { threshold_hours: 12 });
  if (weeklyOtRule.is_enabled) {
    const excessiveWeekly = await pool.query(`
      SELECT
        o.employee_id,
        e.branch_id,
        SUM(o.hours) AS total_hours
      FROM overtime_requests o
      JOIN employees e ON e.id = o.employee_id
      WHERE o.status = 'APPROVED'
        AND o.date >= date_trunc('week', CURRENT_DATE)
        AND o.date <= CURRENT_DATE
      GROUP BY o.employee_id, e.branch_id
      HAVING SUM(o.hours) > $1
    `, [weeklyOtRule.threshold_hours]);

    for (const row of excessiveWeekly.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "EXCESSIVE_OVERTIME", "overtime")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "EXCESSIVE_OVERTIME",
        source_module: "overtime",
        severity: "HIGH",
        title: "Excessive Weekly Overtime",
        description: `Employee worked ${parseFloat(row.total_hours).toFixed(1)} hours of overtime this week`,
        detected_value: `${parseFloat(row.total_hours).toFixed(1)} hours`,
        expected_value: `${weeklyOtRule.threshold_hours} hours or less per week`,
        metadata: { total_hours: parseFloat(row.total_hours), period: "weekly" },
      });
      results.detected++;
    }
  }

  // 3. Repeated rejected overtime requests (threshold_count+ in threshold_days days)
  const rejectedOtRule = await getAnomalyRule("anomaly_rejected_ot", { threshold_count: 3, threshold_days: 30 });
  if (rejectedOtRule.is_enabled) {
    const rejectedOvertime = await pool.query(`
      SELECT
        o.employee_id,
        e.branch_id,
        COUNT(*) AS rejected_count
      FROM overtime_requests o
      JOIN employees e ON e.id = o.employee_id
      WHERE o.status = 'REJECTED'
        AND o.created_at >= CURRENT_DATE - $1::INTEGER
      GROUP BY o.employee_id, e.branch_id
      HAVING COUNT(*) >= $2
    `, [rejectedOtRule.threshold_days, rejectedOtRule.threshold_count]);

    for (const row of rejectedOvertime.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "REJECTED_OVERTIME_REPEATED", "overtime")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "REJECTED_OVERTIME_REPEATED",
        source_module: "overtime",
        severity: "LOW",
        title: "Repeated Rejected Overtime Requests",
        description: `Employee had ${row.rejected_count} overtime requests rejected in the last ${rejectedOtRule.threshold_days} days`,
        detected_value: String(row.rejected_count),
        expected_value: `Less than ${rejectedOtRule.threshold_count} rejections`,
        metadata: { rejected_count: parseInt(row.rejected_count), window_days: rejectedOtRule.threshold_days },
      });
      results.detected++;
    }
  }

  return results;
};

// ============================================
// PAYROLL RULES
// ============================================

const detectPayrollAnomalies = async (req) => {
  const results = { detected: 0, errors: 0 };

  const latestCutoffs = await pool.query(`
    SELECT DISTINCT cutoff_start, cutoff_end
    FROM payroll
    WHERE status IN ('PAID', 'UNPAID')
    ORDER BY cutoff_end DESC
    LIMIT 2
  `);

  if (latestCutoffs.rows.length < 2) return results;

  const current = latestCutoffs.rows[0];
  const previous = latestCutoffs.rows[1];

  // 1. Net salary changes > threshold_percent%
  const salaryRule = await getAnomalyRule("anomaly_salary_change", { threshold_percent: 0.30 });
  if (salaryRule.is_enabled) {
    const salaryChanges = await pool.query(`
      SELECT
        p.employee_id,
        e.branch_id,
        p.net_salary AS current_net,
        prev.net_salary AS previous_net
      FROM payroll p
      JOIN payroll prev ON prev.employee_id = p.employee_id
        AND prev.cutoff_start = $3::date
        AND prev.cutoff_end = $4::date
      JOIN employees e ON e.id = p.employee_id
      WHERE p.cutoff_start = $1::date
        AND p.cutoff_end = $2::date
        AND p.net_salary > 0 AND prev.net_salary > 0
        AND ABS(p.net_salary - prev.net_salary) / prev.net_salary > $5::numeric
    `, [current.cutoff_start, current.cutoff_end, previous.cutoff_start, previous.cutoff_end, salaryRule.threshold_percent]);

    for (const row of salaryChanges.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "PAYROLL_SPIKE", "payroll")) continue;
      const changePercent = Math.abs(
        ((parseFloat(row.current_net) - parseFloat(row.previous_net)) / parseFloat(row.previous_net)) * 100
      ).toFixed(1);
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "PAYROLL_SPIKE",
        source_module: "payroll",
        severity: "HIGH",
        title: "Significant Net Salary Change",
        description: `Net salary changed by ${changePercent}% compared to previous cutoff`,
        detected_value: `${parseFloat(row.current_net).toFixed(2)}`,
        expected_value: `Within ${(salaryRule.threshold_percent * 100).toFixed(0)}% of ${parseFloat(row.previous_net).toFixed(2)}`,
        metadata: {
          current_net: parseFloat(row.current_net),
          previous_net: parseFloat(row.previous_net),
          change_percent: parseFloat(changePercent),
          cutoff_start: current.cutoff_start,
          cutoff_end: current.cutoff_end,
        },
      });
      results.detected++;
    }
  }

  // 2. Deductions spike > threshold_percent%
  const deductionRule = await getAnomalyRule("anomaly_deduction_change", { threshold_percent: 0.50 });
  if (deductionRule.is_enabled) {
    const deductionChanges = await pool.query(`
      SELECT
        p.employee_id,
        e.branch_id,
        p.deductions AS current_ded,
        prev.deductions AS previous_ded
      FROM payroll p
      JOIN payroll prev ON prev.employee_id = p.employee_id
        AND prev.cutoff_start = $3::date
        AND prev.cutoff_end = $4::date
      JOIN employees e ON e.id = p.employee_id
      WHERE p.cutoff_start = $1::date
        AND p.cutoff_end = $2::date
        AND p.deductions > 0 AND prev.deductions > 0
        AND ABS(p.deductions - prev.deductions) / prev.deductions > $5::numeric
    `, [current.cutoff_start, current.cutoff_end, previous.cutoff_start, previous.cutoff_end, deductionRule.threshold_percent]);

    for (const row of deductionChanges.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "PAYROLL_SPIKE", "payroll")) continue;
      const changePercent = Math.abs(
        ((parseFloat(row.current_ded) - parseFloat(row.previous_ded)) / parseFloat(row.previous_ded)) * 100
      ).toFixed(1);
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "PAYROLL_SPIKE",
        source_module: "payroll",
        severity: "HIGH",
        title: "Significant Deduction Change",
        description: `Total deductions changed by ${changePercent}% compared to previous cutoff`,
        detected_value: `${parseFloat(row.current_ded).toFixed(2)}`,
        expected_value: `Within ${(deductionRule.threshold_percent * 100).toFixed(0)}% of ${parseFloat(row.previous_ded).toFixed(2)}`,
        metadata: {
          current_deductions: parseFloat(row.current_ded),
          previous_deductions: parseFloat(row.previous_ded),
          change_percent: parseFloat(changePercent),
          cutoff_start: current.cutoff_start,
          cutoff_end: current.cutoff_end,
        },
      });
      results.detected++;
    }
  }

  return results;
};

// ============================================
// LEAVE RULES
// ============================================

const detectLeaveAnomalies = async (req) => {
  const results = { detected: 0, errors: 0 };

  // 1. Leave requests > threshold_count in threshold_days days
  const frequentLeaveRule = await getAnomalyRule("anomaly_frequent_leave", { threshold_count: 3, threshold_days: 30 });
  if (frequentLeaveRule.is_enabled) {
    const frequentLeave = await pool.query(`
      SELECT
        l.employee_id,
        e.branch_id,
        COUNT(*) AS leave_count
      FROM leaves l
      JOIN employees e ON e.id = l.employee_id
      WHERE l.created_at >= CURRENT_DATE - $1::INTEGER
        AND l.status IN ('APPROVED', 'PENDING')
      GROUP BY l.employee_id, e.branch_id
      HAVING COUNT(*) > $2
    `, [frequentLeaveRule.threshold_days, frequentLeaveRule.threshold_count]);

    for (const row of frequentLeave.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "ABNORMAL_LEAVE_FREQUENCY", "leaves")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "ABNORMAL_LEAVE_FREQUENCY",
        source_module: "leaves",
        severity: "MEDIUM",
        title: "Frequent Leave Requests",
        description: `Employee filed ${row.leave_count} leave requests in the last ${frequentLeaveRule.threshold_days} days`,
        detected_value: String(row.leave_count),
        expected_value: `${frequentLeaveRule.threshold_count} or fewer requests`,
        metadata: { leave_count: parseInt(row.leave_count), window_days: frequentLeaveRule.threshold_days },
      });
      results.detected++;
    }
  }

  // 2. Leave before/after repeated absences (threshold_count in threshold_days)
  const leaveAbsenceRule = await getAnomalyRule("anomaly_leave_around_absence", { threshold_count: 2, threshold_days: 3 });
  if (leaveAbsenceRule.is_enabled) {
    const leaveAroundAbsence = await pool.query(`
      SELECT
        l.employee_id,
        e.branch_id,
        l.from_date,
        l.to_date,
        l.type
      FROM leaves l
      JOIN employees e ON e.id = l.employee_id
      WHERE l.status = 'APPROVED'
        AND l.from_date >= CURRENT_DATE - INTERVAL '7 days'
        AND (
          (SELECT COUNT(*) FROM attendance a
           WHERE a.employee_id = l.employee_id
             AND a.status = 'ABSENT'
             AND a.date BETWEEN l.from_date - $1::INTEGER AND l.from_date - INTERVAL '1 day'
          ) >= $2
          OR
          (SELECT COUNT(*) FROM attendance a
           WHERE a.employee_id = l.employee_id
             AND a.status = 'ABSENT'
             AND a.date BETWEEN l.to_date + INTERVAL '1 day' AND l.to_date + $1::INTEGER
          ) >= $2
        )
    `, [leaveAbsenceRule.threshold_days, leaveAbsenceRule.threshold_count]);

    for (const row of leaveAroundAbsence.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "LEAVE_AROUND_ABSENCE", "leaves")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "LEAVE_AROUND_ABSENCE",
        source_module: "leaves",
        severity: "MEDIUM",
        title: "Leave Adjacent to Repeated Absences",
        description: `Approved leave (${row.from_date.toISOString().split("T")[0]} - ${row.to_date.toISOString().split("T")[0]}) is adjacent to multiple absences`,
        metadata: { from_date: row.from_date, to_date: row.to_date, leave_type: row.type },
      });
      results.detected++;
    }
  }

  // 3. Rejected leave followed by absence
  const rejectedThenAbsent = await pool.query(`
    SELECT
      l.employee_id,
      e.branch_id,
      l.to_date
    FROM leaves l
    JOIN employees e ON e.id = l.employee_id
    WHERE l.status = 'REJECTED'
      AND l.to_date >= CURRENT_DATE - INTERVAL '7 days'
      AND EXISTS (
        SELECT 1 FROM attendance a
        WHERE a.employee_id = l.employee_id
          AND a.status = 'ABSENT'
          AND a.date BETWEEN l.from_date AND l.to_date
      )
  `);

  for (const row of rejectedThenAbsent.rows) {
    if (await shouldSkipDuplicate(row.employee_id, "REJECTED_LEAVE_FOLLOWED_BY_ABSENCE", "leaves")) continue;
    await createAnomalyRecord(req, {
      employee_id: row.employee_id,
      branch_id: row.branch_id,
      anomaly_type: "REJECTED_LEAVE_FOLLOWED_BY_ABSENCE",
      source_module: "leaves",
      severity: "HIGH",
      title: "Rejected Leave Followed by Absence",
      description: "Employee was absent on dates where leave was rejected",
      metadata: { rejected_date: row.to_date },
    });
    results.detected++;
  }

  return results;
};

// ============================================
// TIME MODIFICATION RULES
// ============================================

const detectTimeModificationAnomalies = async (req) => {
  const results = { detected: 0, errors: 0 };

  // 1. More than threshold_count requests in threshold_days days
  const timeModRule = await getAnomalyRule("anomaly_time_mod", { threshold_count: 3, threshold_days: 30 });
  if (timeModRule.is_enabled) {
    const frequentModifications = await pool.query(`
      SELECT
        tmr.employee_id,
        e.branch_id,
        COUNT(*) AS request_count
      FROM time_modification_requests tmr
      JOIN employees e ON e.id = tmr.employee_id
      WHERE tmr.created_at >= CURRENT_DATE - $1::INTEGER
      GROUP BY tmr.employee_id, e.branch_id
      HAVING COUNT(*) > $2
    `, [timeModRule.threshold_days, timeModRule.threshold_count]);

    for (const row of frequentModifications.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "REPEATED_TIME_MODIFICATION", "time_modification")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "REPEATED_TIME_MODIFICATION",
        source_module: "time_modification",
        severity: "MEDIUM",
        title: "Frequent Time Modification Requests",
        description: `Employee submitted ${row.request_count} time modification requests in the last ${timeModRule.threshold_days} days`,
        detected_value: String(row.request_count),
        expected_value: `${timeModRule.threshold_count} or fewer requests`,
        metadata: { request_count: parseInt(row.request_count), window_days: timeModRule.threshold_days },
      });
      results.detected++;
    }
  }

  // 2. Repeated rejected time modification requests (threshold_count+)
  const rejectedTimeModRule = await getAnomalyRule("anomaly_rejected_time_mod", { threshold_count: 3, threshold_days: 30 });
  if (rejectedTimeModRule.is_enabled) {
    const rejectedModifications = await pool.query(`
      SELECT
        tmr.employee_id,
        e.branch_id,
        COUNT(*) AS rejected_count
      FROM time_modification_requests tmr
      JOIN employees e ON e.id = tmr.employee_id
      WHERE tmr.status = 'REJECTED'
        AND tmr.created_at >= CURRENT_DATE - $1::INTEGER
      GROUP BY tmr.employee_id, e.branch_id
      HAVING COUNT(*) >= $2
    `, [rejectedTimeModRule.threshold_days, rejectedTimeModRule.threshold_count]);

    for (const row of rejectedModifications.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "REJECTED_TIME_MODIFICATION_REPEATED", "time_modification")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "REJECTED_TIME_MODIFICATION_REPEATED",
        source_module: "time_modification",
        severity: "HIGH",
        title: "Repeated Rejected Time Modifications",
        description: `Employee had ${row.rejected_count} time modification requests rejected in the last ${rejectedTimeModRule.threshold_days} days`,
        detected_value: String(row.rejected_count),
        expected_value: `Less than ${rejectedTimeModRule.threshold_count} rejections`,
        metadata: { rejected_count: parseInt(row.rejected_count), window_days: rejectedTimeModRule.threshold_days },
      });
      results.detected++;
    }
  }

  return results;
};

// ============================================
// MAN-HOUR RULES
// ============================================

const detectManHourAnomalies = async (req) => {
  const results = { detected: 0, errors: 0 };

  // 1. Reported hours exceed expected work hours (> threshold_hours)
  const manHourExcessiveRule = await getAnomalyRule("anomaly_man_hour_excessive", { threshold_hours: 12 });
  if (manHourExcessiveRule.is_enabled) {
    const excessiveHours = await pool.query(`
      SELECT
        mhr.employee_id,
        e.branch_id,
        mhr.work_date,
        mhr.hours
    FROM man_hour_reports mhr
    JOIN employees e ON e.id = mhr.employee_id
    WHERE mhr.hours > $1
      AND mhr.work_date >= CURRENT_DATE - INTERVAL '7 days'
      AND EXISTS (
        SELECT 1 FROM approval_logs al
        WHERE al.request_type = 'MAN_HOUR'
          AND al.request_id = mhr.id
          AND al.action = 'APPROVED'
      )
    `, [manHourExcessiveRule.threshold_hours]);

    for (const row of excessiveHours.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "MANHOUR_EXCEEDS_EXPECTED", "man_hours")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "MANHOUR_EXCEEDS_EXPECTED",
        source_module: "man_hours",
        severity: "MEDIUM",
        title: "Man-Hour Report Exceeds Expected Hours",
        description: `Employee reported ${row.hours} hours on ${row.work_date.toISOString().split("T")[0]}`,
        detected_value: `${row.hours} hours`,
        expected_value: `${manHourExcessiveRule.threshold_hours} hours or less`,
        metadata: { work_date: row.work_date, hours: parseFloat(row.hours) },
      });
      results.detected++;
    }
  }

  // 2. Overlapping man-hour details
  const overlapping = await pool.query(`
    SELECT
      mhr.employee_id,
      e.branch_id,
      mhr.work_date
    FROM man_hour_reports mhr
    JOIN employees e ON e.id = mhr.employee_id
    WHERE mhr.work_date >= CURRENT_DATE - INTERVAL '7 days'
      AND EXISTS (
        SELECT 1 FROM approval_logs al
        WHERE al.request_type = 'MAN_HOUR'
          AND al.request_id = mhr.id
          AND al.action = 'APPROVED'
      )
      AND EXISTS (
        SELECT 1 FROM man_hour_report_details d1
        JOIN man_hour_report_details d2 ON d2.report_id = d1.report_id
          AND d2.id <> d1.id
          AND d2.time_from < d1.time_to
          AND d2.time_to > d1.time_from
        WHERE d1.report_id = mhr.id
      )
  `);

  for (const row of overlapping.rows) {
    if (await shouldSkipDuplicate(row.employee_id, "MANHOUR_OVERLAP", "man_hours")) continue;
    await createAnomalyRecord(req, {
      employee_id: row.employee_id,
      branch_id: row.branch_id,
      anomaly_type: "MANHOUR_OVERLAP",
      source_module: "man_hours",
      severity: "HIGH",
      title: "Overlapping Man-Hour Details",
      description: `Employee has overlapping time entries in man-hour report for ${row.work_date.toISOString().split("T")[0]}`,
      metadata: { work_date: row.work_date },
    });
    results.detected++;
  }

  // 3. Repeated edits/corrections (threshold_count+ in threshold_days days)
  const manHourEditsRule = await getAnomalyRule("anomaly_man_hour_edits", { threshold_count: 3, threshold_days: 7 });
  if (manHourEditsRule.is_enabled) {
    const repeatedEdits = await pool.query(`
      SELECT
        mhr.employee_id,
        e.branch_id,
        COUNT(*) AS edit_count
      FROM man_hour_reports mhr
      JOIN employees e ON e.id = mhr.employee_id
      WHERE mhr.updated_at > mhr.created_at
        AND mhr.created_at >= CURRENT_DATE - $1::INTEGER
      GROUP BY mhr.employee_id, e.branch_id
      HAVING COUNT(*) >= $2
    `, [manHourEditsRule.threshold_days, manHourEditsRule.threshold_count]);

    for (const row of repeatedEdits.rows) {
      if (await shouldSkipDuplicate(row.employee_id, "MANHOUR_REPEATED_EDITS", "man_hours")) continue;
      await createAnomalyRecord(req, {
        employee_id: row.employee_id,
        branch_id: row.branch_id,
        anomaly_type: "MANHOUR_REPEATED_EDITS",
        source_module: "man_hours",
        severity: "LOW",
        title: "Repeated Man-Hour Report Edits",
        description: `Employee edited man-hour reports ${row.edit_count} times in the last ${manHourEditsRule.threshold_days} days`,
        detected_value: String(row.edit_count),
        expected_value: `Fewer than ${manHourEditsRule.threshold_count} edits`,
        metadata: { edit_count: parseInt(row.edit_count), window_days: manHourEditsRule.threshold_days },
      });
      results.detected++;
    }
  }

  return results;
};

// ============================================
// SCAN RUNNERS
// ============================================

const runDailyAnomalyScan = async (req = null) => {
  logger.info("[AnomalyScan] Starting daily scan...");
  const results = {
    attendance: { detected: 0, errors: 0 },
    overtime: { detected: 0, errors: 0 },
    leaves: { detected: 0, errors: 0 },
    time_modification: { detected: 0, errors: 0 },
    man_hours: { detected: 0, errors: 0 },
    total_detected: 0,
  };

  try {
    results.attendance = await detectAttendanceAnomalies(req);
  } catch (err) {
    logger.error({ err }, "[AnomalyScan] Attendance scan failed");
    results.attendance.errors = 1;
  }

  try {
    results.overtime = await detectOvertimeAnomalies(req);
  } catch (err) {
    logger.error({ err }, "[AnomalyScan] Overtime scan failed");
    results.overtime.errors = 1;
  }

  try {
    results.leaves = await detectLeaveAnomalies(req);
  } catch (err) {
    logger.error({ err }, "[AnomalyScan] Leave scan failed");
    results.leaves.errors = 1;
  }

  try {
    results.time_modification = await detectTimeModificationAnomalies(req);
  } catch (err) {
    logger.error({ err }, "[AnomalyScan] Time modification scan failed");
    results.time_modification.errors = 1;
  }

  try {
    results.man_hours = await detectManHourAnomalies(req);
  } catch (err) {
    logger.error({ err }, "[AnomalyScan] Man-hour scan failed");
    results.man_hours.errors = 1;
  }

  results.total_detected =
    results.attendance.detected +
    results.overtime.detected +
    results.leaves.detected +
    results.time_modification.detected +
    results.man_hours.detected;

  logger.info(`[AnomalyScan] Daily scan complete. ${results.total_detected} anomalies detected.`);
  return results;
};

const runWeeklyAnomalyScan = async (req = null) => {
  logger.info("[AnomalyScan] Starting weekly scan...");
  const results = {
    payroll: { detected: 0, errors: 0 },
    total_detected: 0,
  };

  try {
    results.payroll = await detectPayrollAnomalies(req);
  } catch (err) {
    logger.error({ err }, "[AnomalyScan] Payroll scan failed");
    results.payroll.errors = 1;
  }

  results.total_detected = results.payroll.detected;

  logger.info(`[AnomalyScan] Weekly scan complete. ${results.total_detected} anomalies detected.`);
  return results;
};

module.exports = {
  detectAttendanceAnomalies,
  detectPayrollAnomalies,
  detectOvertimeAnomalies,
  detectLeaveAnomalies,
  detectTimeModificationAnomalies,
  detectManHourAnomalies,
  runDailyAnomalyScan,
  runWeeklyAnomalyScan,
};
