const pool = require("../config/db");

const getUserPermissions = async (userId) => {
  const result = await pool.query(
    `SELECT permission_key FROM user_permissions
     WHERE user_id = $1 AND is_allowed = TRUE`,
    [userId],
  );
  return result.rows.map((r) => r.permission_key);
};

const setUserPermissions = async (userId, permissions) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM user_permissions WHERE user_id = $1`,
      [userId],
    );
    for (const key of permissions) {
      await client.query(
        `INSERT INTO user_permissions (user_id, permission_key, is_allowed)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (user_id, permission_key) DO UPDATE SET is_allowed = TRUE, updated_at = CURRENT_TIMESTAMP`,
        [userId, key],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const resetUserPermissions = async (userId) => {
  await pool.query(
    `DELETE FROM user_permissions WHERE user_id = $1`,
    [userId],
  );
};

const seedAdminPermissions = async (adminUserId) => {
  const { ALL_PERMISSIONS } = require("../constants/permissions");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const key of ALL_PERMISSIONS) {
      await client.query(
        `INSERT INTO user_permissions (user_id, permission_key, is_allowed)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (user_id, permission_key) DO UPDATE SET is_allowed = TRUE, updated_at = CURRENT_TIMESTAMP`,
        [adminUserId, key],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const hasUserPermission = async (userId, permissionKey) => {
  const result = await pool.query(
    `SELECT is_allowed FROM user_permissions
     WHERE user_id = $1 AND permission_key = $2 AND is_allowed = TRUE`,
    [userId, permissionKey],
  );
  return result.rows.length > 0;
};

module.exports = {
  getUserPermissions,
  setUserPermissions,
  resetUserPermissions,
  seedAdminPermissions,
  hasUserPermission,
};
