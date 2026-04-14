const pool = require("../config/db");

// Get setting value by key
const getSetting = async (key) => {
  const result = await pool.query(
    `SELECT value FROM system_settings WHERE key = $1`,
    [key],
  );
  return result.rows[0]?.value || null;
};

// Get setting as boolean
const getBoolSetting = async (key) => {
  const value = await getSetting(key);
  return value === "true" || value === true;
};

// Get setting as string
const getStringSetting = async (key) => {
  return await getSetting(key);
};

// Get setting as number
const getNumberSetting = async (key) => {
  const value = await getSetting(key);
  return value ? Number(value) : null;
};

// Update setting
const updateSetting = async (key, value) => {
  const result = await pool.query(
    `INSERT INTO system_settings (key, value, updated_at) 
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (key) 
     DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [key, value],
  );
  return result.rows[0];
};

// Get all settings
const getAllSettings = async () => {
  const result = await pool.query(
    `SELECT id, key, value, description, updated_at FROM system_settings ORDER BY id`,
  );
  return result.rows;
};

// Toggle boolean setting
const toggleSetting = async (key) => {
  // Get current value using existing function
  const currentValue = await getBoolSetting(key);
  const newValue = !currentValue;

  await updateSetting(key, newValue ? "true" : "false");

  return { key, value: newValue };
};

module.exports = {
  getSetting,
  getBoolSetting,
  getStringSetting,
  getNumberSetting,
  updateSetting,
  getAllSettings,
  toggleSetting,
};
