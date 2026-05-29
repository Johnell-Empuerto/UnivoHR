const ROLES = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  ADMIN: "ADMIN",
  HR_USER: "HR_USER",
  PAYROLL_USER: "PAYROLL_USER",
  EMPLOYEE: "EMPLOYEE",
};

const OLD_ROLE_MAP = {
  ADMIN: ROLES.SYSTEM_ADMIN,
  HR_ADMIN: ROLES.ADMIN,
  HR: ROLES.HR_USER,
};

const NEW_ROLES = new Set(Object.values(ROLES));

const normalizeRole = (role) => {
  if (NEW_ROLES.has(role)) return role;
  return OLD_ROLE_MAP[role] || role;
};

module.exports = { ROLES, normalizeRole };
