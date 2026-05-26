const aiModel = require("../models/ai.model");
const aiEntity = require("./aiEntity.service");
const aiSecurity = require("./aiSecurity.service");
const aiContext = require("./aiContext.service");
const analyticsService = require("./analytics.service");
const drilldownService = require("./drilldown.service");
const forecastService = require("./forecast.service");
const anomalyModel = require("../models/anomaly.model");
const dashboardService = require("./dashboard.service");
const payrollService = require("./payroll.service");
const attendanceService = require("./attendance.service");
const leaveService = require("./leave.service");
const overtimeService = require("./overtime.service");
const profileService = require("./profile.service");
const pool = require("../config/db");
const { getUserBranchIds } = require("../utils/branchAccess");

// ========== INTENT CLASSIFICATION ==========

const INTENT_KEYWORDS = {
  dashboard_summary: ["dashboard", "overview", "summary", "company overview", "key metrics", "general"],
  attendance_summary: ["attendance", "present", "absent", "who is here", "who is out", "attendance rate", "who's in", "who's out"],
  payroll_summary: ["payroll", "salary", "cutoff", "net pay", "gross pay", "payslip", "compensation", "deductions", "deduction"],
  anomaly_summary: ["anomaly", "warning", "unusual", "alert", "issue", "problem", "suspicious", "irregular"],
  forecast_summary: ["forecast", "prediction", "next month", "next week", "projected", "trend", "expected"],
  late_employees: ["late", "tardy", "latecomer", "arrived late", "not on time"],
  absence_summary: ["absence", "absentee", "absenteeism", "not present", "missing", "no show"],
  employee_attendance: ["my attendance", "my time", "my attendance record"],
  employee_payroll: ["my payroll", "my salary", "my payslip", "my compensation"],
  employee_overtime: ["my overtime", "my OT"],
  employee_leave: ["my leave", "my leaves", "my vacation", "my sick leave"],
  employee_late_records: ["my late", "my tardy"],
  employee_profile: ["my profile", "my info", "my details", "my employee info"],
  employee_anomalies: ["my anomaly", "my warning", "my alert"],
  employee_forecast: ["my forecast"],
  department_summary: ["department summary", "department overview", "per department"],
  branch_summary: ["branch summary", "branch overview", "per branch", "by branch"],
};

const classifyIntent = (question) => {
  const q = question.toLowerCase().trim();

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (q.includes(keyword)) {
        return intent;
      }
    }
  }

  return "unknown";
};

const FOLLOW_UP_PATTERNS = [
  { regex: /\b(?:how about|what about|and|also)\s+(.+)/i },
  { regex: /^(?:how about|what about|and|also)\s+(.+)$/i },
  { regex: /^(?:and\s+)?(?:deductions?|net|gross|bonuses?|allowances?|lates|absences|hours|overtime|undertime)\??$/i },
  { regex: /^(?:what\s+)?(?:about|with)\s+(.+)/i },
];

const INTENT_MODULE_MAP = {
  deductions: "payroll",
  deduction: "payroll",
  net: "payroll",
  gross: "payroll",
  bonus: "payroll",
  bonuses: "payroll",
  allowance: "payroll",
  allowances: "payroll",
  lates: "attendance",
  absences: "attendance",
  overtime: "overtime",
  undertime: "attendance",
  hours: "attendance",
  leave: "leave",
  leaves: "leave",
  profile: "profile",
};

const inferFollowUpIntent = (question, lastIntent) => {
  if (!lastIntent) return null;
  const q = question.toLowerCase().trim();

  // Check if this is a short follow-up question
  const isShort = q.split(/\s+/).length <= 4;

  if (!isShort) return null;

  // Extract the subject word from follow-up patterns
  let subject = null;
  for (const { regex } of FOLLOW_UP_PATTERNS) {
    const m = q.match(regex);
    if (m) {
      if (m[1]) subject = m[1].trim().toLowerCase().replace(/[?]/g, "");
      break;
    }
  }

  if (!subject) {
    // Check very short single word questions like "Deductions?"
    const words = q.replace(/[?]/g, "").split(/\s+/).filter(Boolean);
    if (words.length === 1 && INTENT_MODULE_MAP[words[0]]) {
      subject = words[0];
    }
  }

  if (subject) {
    // Map follow-up subject to module
    const module = INTENT_MODULE_MAP[subject];
    if (module) {
      // Derive employee intent from lastIntent if it was employee-scoped
      const isEmployeeScoped = lastIntent.startsWith("employee_");
      if (isEmployeeScoped) {
        const mapped = `employee_${module}`;
        if (Object.keys(HANDLERS).includes(mapped)) return mapped;
      }
      if (Object.keys(HANDLERS).includes(`${module}_summary`)) return `${module}_summary`;
    }
  }

  // If no subject matched, stay with last intent category but allow entity shifts
  if (lastIntent.startsWith("employee_")) {
    return lastIntent;
  }

  return null;
};

const classifyWithEntities = (question, entities, lastIntent) => {
  const q = question.toLowerCase().trim();
  const hasEmployee = entities && entities.employeeId;
  const hasBranch = entities && entities.branchId;
  const hasDepartment = entities && entities.department;

  // Check follow-up first
  if (lastIntent) {
    const followUp = inferFollowUpIntent(question, lastIntent);
    if (followUp) return followUp;
  }

  // Entity-aware classification
  if (hasEmployee) {
    if (/\battendance\b/i.test(q) || /\bpresent\b/i.test(q) || /\btime\b/i.test(q)) return "employee_attendance";
    if (/\bpayroll\b/i.test(q) || /\bsalary\b/i.test(q) || /\bpayslip\b/i.test(q) || /\bdeductions?\b/i.test(q)) return "employee_payroll";
    if (/\bovertime\b/i.test(q) || /\bOT\b/i.test(q)) return "employee_overtime";
    if (/\bleave\b/i.test(q) || /\bvacation\b/i.test(q) || /\bsick\b/i.test(q)) return "employee_leave";
    if (/\blate\b/i.test(q) || /\btardy\b/i.test(q)) return "employee_late_records";
    if (/\banomaly\b/i.test(q) || /\bwarning\b/i.test(q) || /\balert\b/i.test(q)) return "employee_anomalies";
    if (/\bforecast\b/i.test(q) || /\bprediction\b/i.test(q)) return "employee_forecast";
    if (/\bprofile\b/i.test(q) || /\binfo\b/i.test(q) || /\bdetails\b/i.test(q)) return "employee_profile";
  }

  if (hasDepartment && /\b(?:attendance|payroll|summary|overview)\b/i.test(q)) {
    return "department_summary";
  }

  if (hasBranch && /\b(?:attendance|payroll|summary|overview)\b/i.test(q)) {
    return "branch_summary";
  }

  return classifyIntent(question);
};

// ========== SUGGESTIONS ==========

const SUGGESTIONS = {
  dashboard_summary: [
    "Show attendance summary today",
    "Any anomalies or warnings?",
    "What is the forecast for next month?",
  ],
  attendance_summary: [
    "Who is late today?",
    "Compare attendance by branch",
    "Show absence summary",
  ],
  payroll_summary: [
    "Show payroll for last cutoff",
    "What is the total deductions?",
    "Compare payroll across branches",
  ],
  anomaly_summary: [
    "Show recent anomalies",
    "What caused the latest anomaly?",
    "Show anomaly trend this week",
  ],
  forecast_summary: [
    "Show forecast for attendance rate",
    "Predict next payroll cost",
    "Show forecast accuracy",
  ],
  late_employees: [
    "Show late employees this week",
    "Who is the most frequently late?",
    "Show attendance summary today",
  ],
  absence_summary: [
    "Show absence trend this month",
    "Which branch has highest absenteeism?",
    "Show late employees today",
  ],
  employee_attendance: [
    "Show attendance yesterday",
    "Show late records",
    "Show overtime this week",
  ],
  employee_payroll: [
    "Show payroll for last cutoff",
    "Show salary details",
    "Show deductions",
  ],
  employee_overtime: [
    "Show overtime this month",
    "Show attendance today",
    "Show leave records",
  ],
  employee_leave: [
    "Show leave balance",
    "Show attendance this week",
    "Show overtime records",
  ],
  employee_late_records: [
    "Show attendance this week",
    "Show overtime",
    "Show absence records",
  ],
  employee_profile: [
    "Show attendance today",
    "Show payroll summary",
    "Show leave balance",
  ],
  employee_anomalies: [
    "Show my attendance",
    "Show attendance anomalies",
    "Show latest forecast",
  ],
  employee_forecast: [
    "Show my attendance",
    "Show payroll summary",
    "Show anomalies",
  ],
  department_summary: [
    "Show attendance by department",
    "Show payroll by department",
    "Compare departments",
  ],
  branch_summary: [
    "Show attendance by branch",
    "Show payroll by branch",
    "Compare branches",
  ],
  unknown: [
    "Show dashboard summary",
    "Summarize payroll this cutoff",
    "Show attendance issues today",
  ],
};

const generateSuggestions = (intent) => {
  return SUGGESTIONS[intent] || SUGGESTIONS.unknown;
};

// ========== MODULE MAPPING ==========

const INTENT_MODULES = {
  dashboard_summary: ["dashboard"],
  attendance_summary: ["attendance"],
  payroll_summary: ["payroll"],
  anomaly_summary: ["anomaly"],
  forecast_summary: ["forecast"],
  late_employees: ["attendance"],
  absence_summary: ["attendance"],
  employee_attendance: ["attendance"],
  employee_payroll: ["payroll"],
  employee_overtime: ["overtime"],
  employee_leave: ["leaves"],
  employee_late_records: ["attendance"],
  employee_profile: ["employees"],
  employee_anomalies: ["anomaly"],
  employee_forecast: ["forecast"],
  department_summary: ["dashboard", "attendance"],
  branch_summary: ["dashboard", "attendance"],
};

const getUsedModules = (intent) => {
  return INTENT_MODULES[intent] || [];
};

// ========== INTENT HANDLERS ==========

const handleDashboardSummary = async (scope) => {
  if (scope.dataScope === "self_only") {
    const data = await dashboardService.getMyAnalytics(scope.employeeId);
    return {
      answer: `Here is your personal attendance summary: ${data.summary.present || 0} days present, ${data.summary.late || 0} late, ${data.summary.absent || 0} absent, ${data.summary.on_leave || 0} on leave this month.`,
      metadata: { summary: data.summary, trends: data.trends, metrics: data.metrics },
    };
  }

  const user = { id: scope.userId, role: scope.role };
  const overview = await analyticsService.getCompanyOverview(user);
  const att = overview.attendance;
  const anom = overview.anomalies;

  return {
    answer: `Today's attendance: ${att.present} present, ${att.late} late, ${att.absent} absent, ${att.on_leave} on leave. Open anomalies: ${anom.open_count} (${anom.high_severity_count} high severity).`,
    metadata: { attendance: att, anomalies: anom },
  };
};

const handleAttendanceSummary = async (scope) => {
  if (scope.dataScope === "self_only") {
    const summary = await dashboardService.getMySummary(scope.employeeId);
    return {
      answer: `Your attendance this month: ${summary.present || 0} present, ${summary.late || 0} late, ${summary.absent || 0} absent, ${summary.on_leave || 0} on leave.`,
      metadata: { summary },
    };
  }

  const summary = await analyticsService.getAttendanceSummary(scope.allowedBranchIds);
  const total = [summary.present, summary.late, summary.absent, summary.on_leave]
    .reduce((a, b) => Number(a) + Number(b), 0);

  const rate = total > 0 ? (((Number(summary.present) + Number(summary.late)) / total) * 100).toFixed(1) : 0;

  return {
    answer: `Today attendance summary: ${summary.present} present, ${summary.late} late, ${summary.absent} absent, ${summary.on_leave} on leave. Attendance rate: ${rate}%.`,
    metadata: { summary, attendance_rate: rate, total_records: total },
  };
};

const handlePayrollSummary = async (scope) => {
  if (scope.dataScope === "self_only") {
    const details = await payrollService.getMySalaryDetails(scope.employeeId);
    return {
      answer: details
        ? `Your basic salary is ${details.basic_salary}. Your current deductions include ${details.deductions || "none specified"}.`
        : "No payroll details found for your account.",
      metadata: { details: details || null },
    };
  }

  const payrollSummary = await pool.query(`
    SELECT
      COALESCE(SUM(p.gross_salary), 0) AS total_gross,
      COALESCE(SUM(p.total_deductions), 0) AS total_deductions,
      COALESCE(SUM(p.net_salary), 0) AS total_net,
      COUNT(*) AS payroll_count,
      COUNT(*) FILTER (WHERE p.status = 'PAID') AS paid_count
    FROM payroll p
    JOIN employees e ON e.id = p.employee_id
    WHERE p.cutoff_end >= CURRENT_DATE - INTERVAL '45 days'
  `);

  const row = payrollSummary.rows[0] || { total_gross: 0, total_deductions: 0, total_net: 0, payroll_count: 0, paid_count: 0 };

  return {
    answer: `Payroll summary (last 45 days): ${row.payroll_count} records, total gross ${Number(row.total_gross).toLocaleString()}, total net ${Number(row.total_net).toLocaleString()}, total deductions ${Number(row.total_deductions).toLocaleString()}. Paid: ${row.paid_count}.`,
    metadata: { summary: row },
  };
};

const handleAnomalySummary = async (scope) => {
  let allowedBranchIds = scope.allowedBranchIds;

  if (scope.dataScope === "self_only") {
    const anomalies = await anomalyModel.getAnomalies({
      employee_id: scope.employeeId,
      page: 1,
      limit: 5,
    });
    const count = anomalies.pagination.total;
    return {
      answer: count > 0
        ? `You have ${count} anomaly record(s). Latest: ${anomalies.data.slice(0, 3).map(a => `${a.title} (${a.severity})`).join(", ")}.`
        : "You have no anomaly records.",
      metadata: { anomalies: anomalies.data, total: count },
    };
  }

  const [trend, summary] = await Promise.all([
    analyticsService.getAnomalyTrend(7),
    anomalyModel.getAnomalySummary({ allowedBranchIds }),
  ]);

  const recentCount = trend.reduce((sum, d) => sum + Number(d.total), 0);

  return {
    answer: `Anomaly summary: ${summary.open_count} open (${summary.high_severity_count} high severity). ${recentCount} anomalies detected in the last 7 days.`,
    metadata: { summary, recent_trend: trend },
  };
};

const handleForecastSummary = async (scope) => {
  if (scope.dataScope === "self_only") {
    return {
      answer: "Forecast summaries are available for administrators and HR personnel.",
      metadata: {},
    };
  }

  const forecasts = await analyticsService.getForecastSummary();
  if (!forecasts || forecasts.length === 0) {
    return {
      answer: "No forecast data available yet. Forecasts are generated nightly.",
      metadata: { forecasts: [] },
    };
  }

  const lines = forecasts.map(f =>
    `${f.metric_name} (${f.period_type}): predicted ${Number(f.predicted_value).toFixed(2)}, confidence ${(Number(f.confidence) * 100).toFixed(0)}%`
  );

  return {
    answer: `Latest forecasts:\n${lines.join("\n")}`,
    metadata: { forecasts },
  };
};

const handleLateEmployees = async (scope) => {
  if (scope.dataScope === "self_only") {
    const status = await dashboardService.getTodayStatus(scope.employeeId);
    const isLate = status && status.status === "LATE";
    return {
      answer: isLate
        ? `You were marked LATE today. Check-in time: ${status.check_in_time || "N/A"}.`
        : "You are not marked late today.",
      metadata: { today_status: status || null },
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const result = await drilldownService.getDrillDownAttendance(scope, {
    status: "LATE",
    date_from: today,
    date_to: today,
    page: 1,
    limit: 10,
  });

  if (!result.data || result.data.length === 0) {
    return {
      answer: "No late employees today.",
      metadata: { late_employees: [], total: 0 },
    };
  }

  const names = result.data.map(e => e.employee_name).join(", ");
  return {
    answer: `Late employees today (${result.pagination.total}): ${names}`,
    metadata: { late_employees: result.data, total: result.pagination.total },
  };
};

const handleAbsenceSummary = async (scope) => {
  if (scope.dataScope === "self_only") {
    const summary = await dashboardService.getMySummary(scope.employeeId);
    return {
      answer: `Your absence count this month: ${summary.absent || 0} days.`,
      metadata: { absent_days: Number(summary.absent) || 0 },
    };
  }

  const summary = await analyticsService.getAttendanceSummary(scope.allowedBranchIds);
  const absentCount = Number(summary.absent) || 0;
  const total = [summary.present, summary.late, summary.absent, summary.on_leave]
    .reduce((a, b) => Number(a) + Number(b), 0);
  const rate = total > 0 ? ((absentCount / total) * 100).toFixed(1) : 0;

  return {
    answer: `Today's absenteeism: ${absentCount} employees absent (${rate}% absence rate).`,
    metadata: { absent_count: absentCount, absence_rate: rate, total_employees: total },
  };
};

// ========== ENTITY-AWARE HANDLERS ==========

const getEmployeeAttendance = async (scope, entities) => {
  const empId = entities.employeeId || scope.employeeId;
  const df = entities.date_from || new Date().toISOString().split("T")[0];
  const dt = entities.date_to || df;

  const employee = await pool.query(`SELECT first_name, last_name FROM employees WHERE id = $1`, [empId]);
  if (!employee.rows[0]) return { answer: "Employee not found.", metadata: {} };
  const empName = `${employee.rows[0].first_name} ${employee.rows[0].last_name}`;

  const records = await pool.query(`
    SELECT a.date, a.status, a.check_in_time, a.check_out_time, a.hours_worked
    FROM attendance a
    WHERE a.employee_id = $1 AND a.date >= $2::date AND a.date <= $3::date
    ORDER BY a.date DESC LIMIT 10
  `, [empId, df, dt]);

  if (records.rows.length === 0) {
    return { answer: `${empName} has no attendance records from ${df} to ${dt}.`, metadata: { employeeId: empId } };
  }

  const lines = records.rows.map(r =>
    `${r.date}: ${r.status}${r.check_in_time ? ` (IN: ${r.check_in_time.substring(0,5)})` : ""}${r.check_out_time ? ` (OUT: ${r.check_out_time.substring(0,5)})` : ""}`
  );
  return {
    answer: `Attendance for ${empName} (${df} to ${dt}):\n${lines.join("\n")}`,
    metadata: { employeeId: empId, records: records.rows },
  };
};

const fmtDate = (d) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
};
const fmtPeso = (v) => `₱${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getEmployeePayroll = async (scope, entities) => {
  const empId = entities.employeeId || scope.employeeId;

  const employee = await pool.query(`SELECT first_name, middle_name, last_name, suffix FROM employees WHERE id = $1`, [empId]);
  if (!employee.rows[0]) return { answer: "Employee not found.", metadata: {} };
  const e = employee.rows[0];
  const mid = e.middle_name ? ` ${e.middle_name}` : "";
  const suf = e.suffix ? `, ${e.suffix}` : "";
  const empName = `${e.first_name}${mid} ${e.last_name}${suf}`;

  const df = entities.date_from;
  const dt = entities.date_to;

  let query = `SELECT p.cutoff_start, p.cutoff_end, p.basic_salary, p.overtime_pay, p.deductions, p.net_salary, p.status, p.pay_date FROM payroll p WHERE p.employee_id = $1`;
  const params = [empId];
  let idx = 2;
  if (df) { query += ` AND p.cutoff_start >= $${idx}::date`; params.push(df); idx++; }
  if (dt) { query += ` AND p.cutoff_end <= $${idx}::date`; params.push(dt); idx++; }
  query += ` ORDER BY p.cutoff_start DESC LIMIT 5`;

  const result = await pool.query(query, params);
  if (!result.rows || result.rows.length === 0) {
    return { answer: `No payroll records found for ${empName}.`, metadata: { employeeId: empId } };
  }

  const records = result.rows;
  const lines = records.map(r => {
    const parts = [
      `${fmtDate(r.cutoff_start)} → ${fmtDate(r.cutoff_end)}`,
      `Basic Salary: ${fmtPeso(r.basic_salary)}`,
      `Overtime: ${fmtPeso(r.overtime_pay)}`,
      `Deductions: ${fmtPeso(r.deductions)}`,
      `Net Salary: ${fmtPeso(r.net_salary)}`,
      `Status: ${r.status}`,
    ];
    return parts.join("\n");
  });
  return {
    answer: `Payroll for ${empName}\n${lines.join("\n")}`,
    metadata: { employeeId: empId, records },
  };
};

const getEmployeeOvertime = async (scope, entities) => {
  const empId = entities.employeeId || scope.employeeId;
  const df = entities.date_from;
  const dt = entities.date_to;

  const employee = await pool.query(`SELECT first_name, last_name FROM employees WHERE id = $1`, [empId]);
  if (!employee.rows[0]) return { answer: "Employee not found.", metadata: {} };
  const empName = `${employee.rows[0].first_name} ${employee.rows[0].last_name}`;

  let query = `SELECT o.date, o.hours, o.status, o.reason FROM overtime_requests o WHERE o.employee_id = $1`;
  const params = [empId];
  let idx = 2;
  if (df) { query += ` AND o.date >= $${idx}::date`; params.push(df); idx++; }
  if (dt) { query += ` AND o.date <= $${idx}::date`; params.push(dt); }
  query += ` ORDER BY o.date DESC LIMIT 10`;

  const records = await pool.query(query, params);

  if (records.rows.length === 0) {
    return { answer: `${empName} has no overtime records.`, metadata: { employeeId: empId } };
  }

  const lines = records.rows.map(r => `${r.date}: ${r.hours}h (${r.status})${r.reason ? ` - ${r.reason}` : ""}`);
  return {
    answer: `Overtime for ${empName}:\n${lines.join("\n")}`,
    metadata: { employeeId: empId, records: records.rows },
  };
};

const getEmployeeLeave = async (scope, entities) => {
  const empId = entities.employeeId || scope.employeeId;

  const employee = await pool.query(`SELECT first_name, last_name FROM employees WHERE id = $1`, [empId]);
  if (!employee.rows[0]) return { answer: "Employee not found.", metadata: {} };
  const empName = `${employee.rows[0].first_name} ${employee.rows[0].last_name}`;

  const records = await pool.query(`
    SELECT l.type, l.from_date, l.to_date, l.status, lt.name AS leave_type_name
    FROM leaves l
    LEFT JOIN leave_types lt ON lt.id = l.leave_type_id
    WHERE l.employee_id = $1
    ORDER BY l.from_date DESC LIMIT 10
  `, [empId]);

  if (records.rows.length === 0) {
    return { answer: `${empName} has no leave records.`, metadata: { employeeId: empId } };
  }

  const lines = records.rows.map(r => `${r.from_date} to ${r.to_date}: ${r.leave_type_name || r.type} (${r.status})`);
  return {
    answer: `Leave records for ${empName}:\n${lines.join("\n")}`,
    metadata: { employeeId: empId, records: records.rows },
  };
};

const getEmployeeLateRecords = async (scope, entities) => {
  const empId = entities.employeeId || scope.employeeId;
  const df = entities.date_from;
  const dt = entities.date_to;

  const employee = await pool.query(`SELECT first_name, last_name FROM employees WHERE id = $1`, [empId]);
  if (!employee.rows[0]) return { answer: "Employee not found.", metadata: {} };
  const empName = `${employee.rows[0].first_name} ${employee.rows[0].last_name}`;

  let query = `SELECT a.date, a.check_in_time, a.late_minutes FROM attendance a WHERE a.employee_id = $1 AND a.status = 'LATE'`;
  const params = [empId];
  let idx = 2;
  if (df) { query += ` AND a.date >= $${idx}::date`; params.push(df); idx++; }
  if (dt) { query += ` AND a.date <= $${idx}::date`; params.push(dt); }
  query += ` ORDER BY a.date DESC LIMIT 10`;

  const records = await pool.query(query, params);

  if (records.rows.length === 0) {
    return { answer: `${empName} has no late records.`, metadata: { employeeId: empId } };
  }

  const lines = records.rows.map(r => `${r.date}: IN ${r.check_in_time ? r.check_in_time.substring(0,5) : "N/A"} (${r.late_minutes || 0} min late)`);
  return {
    answer: `Late records for ${empName}:\n${lines.join("\n")}`,
    metadata: { employeeId: empId, records: records.rows },
  };
};

const getEmployeeAnomalies = async (scope, entities) => {
  const empId = entities.employeeId || scope.employeeId;

  const employee = await pool.query(`SELECT first_name, last_name FROM employees WHERE id = $1`, [empId]);
  if (!employee.rows[0]) return { answer: "Employee not found.", metadata: {} };
  const empName = `${employee.rows[0].first_name} ${employee.rows[0].last_name}`;

  const anomalies = await anomalyModel.getAnomalies({ employee_id: empId, page: 1, limit: 5 });
  if (!anomalies.data || anomalies.data.length === 0) {
    return { answer: `${empName} has no anomaly records.`, metadata: { employeeId: empId } };
  }

  const lines = anomalies.data.map(a => `${a.title} (${a.severity}) - ${a.detected_at ? new Date(a.detected_at).toLocaleDateString() : ""}`);
  return {
    answer: `Anomalies for ${empName}:\n${lines.join("\n")}`,
    metadata: { employeeId: empId, anomalies: anomalies.data },
  };
};

const getEmployeeForecast = async (scope, entities) => {
  return {
    answer: "Employee-specific forecasts are not available yet. Please check the general forecast summary.",
    metadata: {},
  };
};

const getEmployeeProfile = async (scope, entities) => {
  const empId = entities.employeeId || scope.employeeId;

  try {
    const profile = await profileService.getProfile(empId);
    if (!profile) return { answer: "Employee profile not found.", metadata: {} };

    return {
      answer: `Profile: ${profile.full_name} (${profile.employee_code})\nDepartment: ${profile.department || "N/A"}\nPosition: ${profile.position || "N/A"}\nStatus: ${profile.status || "N/A"}`,
      metadata: { employeeId: empId, profile: aiSecurity.sanitizeResponse(profile) },
    };
  } catch {
    return { answer: "Employee profile not found.", metadata: {} };
  }
};

const getDepartmentSummary = async (scope, entities) => {
  const dept = entities.department;
  if (!dept) return { answer: "Please specify a department.", metadata: {} };

  const summary = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE a.status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent,
      COUNT(*) AS total
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE e.department = $1 AND a.date = CURRENT_DATE
  `, [dept]);

  const row = summary.rows[0] || { present: 0, late: 0, absent: 0, total: 0 };
  return {
    answer: `${dept} department today: ${row.present} present, ${row.late} late, ${row.absent} absent.`,
    metadata: { department: dept, summary: row },
  };
};

const getBranchSummary = async (scope, entities) => {
  const branchId = entities.branchId;
  if (!branchId) return { answer: "Please specify a branch.", metadata: {} };

  const branch = await pool.query(`SELECT name FROM branches WHERE id = $1`, [branchId]);
  const branchName = branch.rows[0] ? branch.rows[0].name : `Branch #${branchId}`;

  const summary = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
      COUNT(*) FILTER (WHERE a.status = 'LATE') AS late,
      COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent,
      COUNT(*) AS total
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE e.branch_id = $1 AND a.date = CURRENT_DATE
  `, [branchId]);

  const row = summary.rows[0] || { present: 0, late: 0, absent: 0, total: 0 };
  return {
    answer: `${branchName} today: ${row.present} present, ${row.late} late, ${row.absent} absent.`,
    metadata: { branchId, branchName, summary: row },
  };
};

const handleUnknown = async () => {
  return {
    answer: "I can help with dashboard, attendance, payroll, anomalies, and forecasts. Try asking about a specific employee, department, or branch.",
  };
};

const HANDLERS = {
  dashboard_summary: handleDashboardSummary,
  attendance_summary: handleAttendanceSummary,
  payroll_summary: handlePayrollSummary,
  anomaly_summary: handleAnomalySummary,
  forecast_summary: handleForecastSummary,
  late_employees: handleLateEmployees,
  absence_summary: handleAbsenceSummary,
  employee_attendance: getEmployeeAttendance,
  employee_payroll: getEmployeePayroll,
  employee_overtime: getEmployeeOvertime,
  employee_leave: getEmployeeLeave,
  employee_late_records: getEmployeeLateRecords,
  employee_anomalies: getEmployeeAnomalies,
  employee_forecast: getEmployeeForecast,
  employee_profile: getEmployeeProfile,
  department_summary: getDepartmentSummary,
  branch_summary: getBranchSummary,
  unknown: handleUnknown,
};

// ========== MAIN CHAT HANDLER ==========

const processChat = async ({ user, question, sessionId }) => {
  const startTime = Date.now();

  // 1. Get or create session
  let session;
  if (sessionId) {
    session = await aiModel.getSessionById(sessionId, user.id);
  }
  if (!session) {
    const title = question.length > 60 ? question.substring(0, 60) + "..." : question;
    session = await aiModel.createSession({ user_id: user.id, title });
    sessionId = session.id;
  }

  // 2. Build scope
  const scope = {
    role: user.role,
    dataScope: user.aiScope ? user.aiScope.dataScope : "all_branches",
    allowedBranchIds: user.aiScope ? user.aiScope.allowedBranchIds : null,
    employeeId: user.aiScope ? user.aiScope.employeeId : null,
    userId: user.id,
  };

  // 3. Load conversation context
  const context = aiContext.getContext(sessionId);

  // 4. Extract entities with context
  const entities = await aiEntity.extractEntities(question, context ? context.entities : null);

  // 5. Classify intent (entity-aware, follow-up aware)
  const intent = classifyWithEntities(question, entities, context ? context.lastIntent : null);
  const usedModules = getUsedModules(intent);

  // 6. Security check
  let permissionResult = "GRANTED";
  let deniedReason = null;

  if (!aiSecurity.canAccessIntent(user, intent)) {
    permissionResult = "DENIED";
    deniedReason = aiSecurity.getDeniedReason(user, intent, entities);
  } else if (entities.employeeId && !aiSecurity.canAccessEmployee(user, entities.employeeId, scope)) {
    permissionResult = "DENIED";
    deniedReason = aiSecurity.getDeniedReason(user, intent, entities);
  } else if (entities.branchId && !aiSecurity.canAccessBranch(user, entities.branchId, scope)) {
    permissionResult = "DENIED";
    deniedReason = "You do not have access to this branch.";
  }

  // 7. Save user message
  await aiModel.createMessage({
    session_id: sessionId,
    user_id: user.id,
    role: "user",
    content: question,
    intent,
    metadata: { data_scope: scope.dataScope, entities },
  });

  // 8. Generate response or deny
  let handlerResult;
  let responseStatus = "SUCCESS";
  let errorMessage = null;

  if (permissionResult === "DENIED") {
    responseStatus = "REJECTED";
    handlerResult = { answer: deniedReason };
  } else {
    try {
      const handler = HANDLERS[intent] || handleUnknown;
      handlerResult = await handler(scope, entities);
    } catch (error) {
      console.error("[AI Service] Handler error:", error.message);
      responseStatus = "ERROR";
      errorMessage = error.message;
      handlerResult = { answer: "I encountered an error processing your request. Please try again." };
    }
  }

  // 9. Sanitize response
  handlerResult.answer = handlerResult.answer || "";
  const sanitizedMetadata = handlerResult.metadata ? aiSecurity.sanitizeResponse(handlerResult.metadata) : {};

  // 10. Save assistant message
  const assistantMessage = await aiModel.createMessage({
    session_id: sessionId,
    user_id: user.id,
    role: "assistant",
    content: handlerResult.answer,
    intent,
    metadata: sanitizedMetadata,
  });

  // 11. Update session
  await aiModel.updateSession(sessionId, { touchLastMessage: true });

  // 12. Update conversation context
  aiContext.updateContext(sessionId, {
    entities,
    lastIntent: intent,
    lastQuestion: question,
    lastModule: intent.replace(/^(employee_|department_|branch_)/, "").replace(/_summary$/, ""),
    lastCutoffDates: entities.cutoff_label || null,
  });

  // 13. Save audit log with entities and security info
  const responseTime = Date.now() - startTime;
  await aiModel.createAuditLog({
    user_id: user.id,
    session_id: sessionId,
    question,
    detected_intent: intent,
    data_scope: scope.dataScope,
    used_modules: usedModules,
    response_status: responseStatus,
    error_message: errorMessage,
    entities,
    accessed_employee_id: entities.employeeId || null,
    accessed_branch_id: entities.branchId || null,
    accessed_department: entities.department || null,
    permission_result: permissionResult,
    denied_reason: deniedReason,
    response_time_ms: responseTime,
  });

  // 14. Generate suggestions
  const suggestions = generateSuggestions(intent);

  return {
    sessionId: Number(sessionId),
    messageId: Number(assistantMessage.id),
    intent,
    entities,
    answer: handlerResult.answer,
    suggestions,
    metadata: sanitizedMetadata,
  };
};

module.exports = {
  processChat,
  classifyIntent,
  generateSuggestions,
  getSessions: aiModel.getSessions,
  getSessionById: aiModel.getSessionById,
  getMessagesBySession: aiModel.getMessagesBySession,
  deleteSession: aiModel.deleteSession,
  createFeedback: aiModel.createFeedback,
  getActiveTemplates: aiModel.getActiveTemplates,
};
