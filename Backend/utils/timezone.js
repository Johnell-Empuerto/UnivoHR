const pool = require("../config/db");

const resolveEmployeeTimezone = async (employeeId, deviceId = null) => {
  if (deviceId) {
    const result = await pool.query(`
      SELECT b.timezone FROM devices d
      JOIN branches b ON b.id = d.branch_id
      WHERE d.id = $1 AND d.branch_id IS NOT NULL
    `, [deviceId]);
    if (result.rows[0]?.timezone) return result.rows[0].timezone;
  }

  const result = await pool.query(`
    SELECT b.timezone FROM employees e
    JOIN branches b ON b.id = e.branch_id
    WHERE e.id = $1 AND e.branch_id IS NOT NULL
  `, [employeeId]);
  if (result.rows[0]?.timezone) return result.rows[0].timezone;

  const setting = await pool.query(
    "SELECT value FROM system_settings WHERE key = 'company_timezone'",
  );
  if (setting.rows[0]?.value) return setting.rows[0].value;

  return 'Asia/Manila';
};

const resolveBranchId = async (employeeId) => {
  const result = await pool.query(
    "SELECT branch_id FROM employees WHERE id = $1",
    [employeeId],
  );
  return result.rows[0]?.branch_id || null;
};

const resolveDeviceBranchId = async (deviceId) => {
  if (!deviceId) return null;
  const result = await pool.query(
    "SELECT branch_id FROM devices WHERE id = $1",
    [deviceId],
  );
  return result.rows[0]?.branch_id || null;
};

module.exports = {
  resolveEmployeeTimezone,
  resolveBranchId,
  resolveDeviceBranchId,
};
