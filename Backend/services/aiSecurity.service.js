// ========== SENSITIVE FIELD FILTER ==========

const SENSITIVE_PATTERNS = [
  /password_hash/i,
  /refresh.?token/i,
  /face_descriptor/i,
  /face.?image/i,
  /smtp.?password/i,
  /smtp_pass/i,
  /db_password/i,
  /database.?password/i,
  /jwt.?secret/i,
  /jwt_secret/i,
];

const sanitizeResponse = (data) => {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitizeResponse);

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_PATTERNS.some((p) => p.test(key))) continue;
    sanitized[key] = typeof value === "object" && value !== null ? sanitizeResponse(value) : value;
  }
  return sanitized;
};

// ========== EMPLOYEE ACCESS CHECK ==========

const canAccessEmployee = (user, targetEmployeeId, scope) => {
  if (user.role === "ADMIN" || user.role === "HR_ADMIN") return true;

  if (user.role === "HR") {
    if (!scope.allowedBranchIds || scope.allowedBranchIds.length === 0) return false;
    return true;
  }

  if (user.role === "EMPLOYEE") {
    return Number(targetEmployeeId) === Number(scope.employeeId);
  }

  return false;
};

const canAccessBranch = (user, targetBranchId, scope) => {
  if (user.role === "ADMIN" || user.role === "HR_ADMIN") return true;

  if (user.role === "HR") {
    if (!targetBranchId) return true;
    return scope.allowedBranchIds.includes(Number(targetBranchId));
  }

  return false;
};

const canAccessDepartment = (user) => {
  if (user.role === "ADMIN" || user.role === "HR_ADMIN" || user.role === "HR") return true;
  return false;
};

// ========== INTENT ACCESS CHECK ==========

const RESTRICTED_INTENTS = [
  "payroll_summary",
  "anomaly_summary",
  "forecast_summary",
  "department_summary",
  "branch_summary",
  "employee_payroll",
  "employee_anomalies",
  "employee_forecast",
];

const canAccessIntent = (user, intent) => {
  if (user.role === "ADMIN" || user.role === "HR_ADMIN") return true;
  if (user.role === "HR") {
    if (intent === "forecast_summary" || intent === "employee_forecast") return false;
    return true;
  }
  if (user.role === "EMPLOYEE") {
    if (RESTRICTED_INTENTS.includes(intent)) return false;
    return true;
  }
  return false;
};

const getDeniedReason = (user, intent, entities) => {
  if (user.role === "EMPLOYEE") {
    if (entities && entities.employeeId && Number(entities.employeeId) !== Number(user.employee_id)) {
      return "You do not have permission to access other employee information.";
    }
    if (RESTRICTED_INTENTS.includes(intent)) {
      return "You do not have permission to access this information.";
    }
  }
  if (user.role === "HR" && entities && entities.employeeId) {
    return "You do not have permission to access this employee's information.";
  }
  return "You do not have permission to perform this action.";
};

module.exports = {
  sanitizeResponse,
  canAccessEmployee,
  canAccessBranch,
  canAccessDepartment,
  canAccessIntent,
  getDeniedReason,
};
