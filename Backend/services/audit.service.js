const pool = require("../config/db");

const ALLOWED_TABLES = new Set([
  "users", "employees", "attendance", "leaves", "overtime_requests",
  "payroll", "employee_salary", "employee_deductions", "approval_logs",
  "branches", "user_branch_access", "payroll_settings", "attendance_rules",
  "audit_logs",
  "hr_policy_documents",
  "job_positions", "applicants", "applicant_documents",
  "applicant_interviews", "applicant_approvals",
  "employee_onboarding", "employee_requirements",
]);

const sanitizeTableName = (name) => {
  if (!name || !ALLOWED_TABLES.has(name)) {
    throw new Error(`Invalid table name: ${name}`);
  }
  return name;
};

const getIpAddress = (req) => {
  if (!req) return null;
  const ip = req.ip || req.connection?.remoteAddress || req.headers?.["x-forwarded-for"];
  if (!ip) return null;
  if (ip.includes("::")) {
    const parts = ip.split(":");
    return parts[parts.length - 1] === "1" ? "127.0.0.1" : parts.pop();
  }
  return ip;
};

const getUserAgent = (req) => {
  return req?.headers?.["user-agent"] || null;
};

const auditLog = async (req, {
  action,
  table_name,
  record_id,
  employee_id,
  branch_id,
  old_values,
  new_values,
  description,
} = {}) => {
  try {
    const user_id = req?.user?.id || null;
    const ip_address = getIpAddress(req);
    const user_agent = getUserAgent(req);

    await pool.query(
      `INSERT INTO audit_logs
        (user_id, employee_id, branch_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        user_id,
        employee_id || null,
        branch_id || null,
        action,
        table_name,
        record_id || null,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        ip_address,
        user_agent,
        description || null,
      ],
    );
  } catch (err) {
    console.error("[Audit] Failed to log:", err.message);
  }
};

const fetchOldValues = async (tableName, recordId) => {
  if (!recordId) return null;
  try {
    const safeName = sanitizeTableName(tableName);
    const result = await pool.query(
      `SELECT row_to_json(t) AS data FROM (SELECT * FROM ${safeName} WHERE id = $1) t`,
      [recordId],
    );
    return result.rows[0]?.data || null;
  } catch (err) {
    console.error(`[Audit] Failed to fetch old values from ${tableName}:`, err.message);
    return null;
  }
};

const log = async ({ actor_id, action, entity_type, entity_id, old_values, new_values, employee_id, req }) => {
  return auditLog(req, {
    action,
    table_name: entity_type,
    record_id: entity_id,
    employee_id: employee_id || null,
    old_values: old_values || null,
    new_values: new_values || null,
  });
};

module.exports = { auditLog, fetchOldValues, log };
