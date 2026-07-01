const pool = require("../config/db");
const notificationService = require("./notification.service");
const logger = require("../utils/logger");

const getUserByEmployeeId = async (employeeId) => {
  if (!employeeId) return null;
  const result = await pool.query(
    `SELECT id FROM users WHERE employee_id = $1 LIMIT 1`,
    [employeeId],
  );
  return result.rows[0] || null;
};

const notifyEmployee = async (employeeId, payload) => {
  if (!employeeId) return null;
  const user = await getUserByEmployeeId(employeeId);
  if (!user) {
    logger.warn(`[notifyEmployee] No user found for employee_id ${employeeId}`);
    return null;
  }
  return notificationService.notify({ ...payload, user_id: user.id });
};

const getUsersWithPermission = async (permissionKey) => {
  const result = await pool.query(
    `SELECT DISTINCT u.id FROM users u
     WHERE u.role = 'ADMIN'
        OR EXISTS (
          SELECT 1 FROM user_permissions up
          WHERE up.user_id = u.id AND up.permission_key = $1 AND up.is_allowed = true
        )`,
    [permissionKey],
  );
  return result.rows.map(r => r.id);
};

const getUsersWithAnyPermission = async (permissionKeys) => {
  if (!permissionKeys || permissionKeys.length === 0) return [];
  const result = await pool.query(
    `SELECT DISTINCT u.id FROM users u
     WHERE u.role = 'ADMIN'
        OR EXISTS (
          SELECT 1 FROM user_permissions up
          WHERE up.user_id = u.id AND up.permission_key = ANY($1::varchar[]) AND up.is_allowed = true
        )`,
    [permissionKeys],
  );
  return result.rows.map(r => r.id);
};

const notifyUsersWithPermission = async (permissionKey, payload) => {
  const userIds = await getUsersWithPermission(permissionKey);
  return Promise.allSettled(
    userIds.map(uid => notificationService.notify({ ...payload, user_id: uid })),
  );
};

const notifyUsersWithAnyPermission = async (permissionKeys, payload) => {
  const userIds = await getUsersWithAnyPermission(permissionKeys);
  return Promise.allSettled(
    userIds.map(uid => notificationService.notify({ ...payload, user_id: uid })),
  );
};

module.exports = {
  getUserByEmployeeId,
  notifyEmployee,
  getUsersWithPermission,
  getUsersWithAnyPermission,
  notifyUsersWithPermission,
  notifyUsersWithAnyPermission,
};
