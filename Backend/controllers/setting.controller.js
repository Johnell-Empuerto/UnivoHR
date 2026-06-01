const settingService = require("../services/setting.service");
const audit = require("../services/audit.service");

// Get all settings
const getAllSettings = async (req, res) => {
  try {
    const settings = await settingService.getAllSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single setting
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const value = await settingService.getSetting(key);
    res.json({ key, value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update setting
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const result = await settingService.updateSetting(key, value);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "system_settings",
      record_id: null,
      new_values: { key, value },
      description: `System setting updated: ${key} = ${value}`,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get next employee code (preview)
const getNextEmployeeCode = async (req, res) => {
  try {
    const pool = require("../config/db");
    const { getEmployeeCodeSettings } = require("../services/applicant.service");
    const settings = await getEmployeeCodeSettings(pool);
    const prefix = settings.prefix || 'EMP';
    const separator = settings.separator || '';
    const padding = Math.max(1, parseInt(settings.padding) || 4);
    const counter = Math.max(0, parseInt(settings.counter) || 0);

    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedSep = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = `^${escapedPrefix}${escapedSep}[0-9]+$`;

    const result = await pool.query(
      `SELECT employee_code FROM employees
       WHERE employee_code ~ $1
       ORDER BY CAST(SUBSTRING(employee_code FROM $2) AS INTEGER) DESC LIMIT 1`,
      [pattern, prefix.length + separator.length + 1],
    );

    let nextNumber = counter + 1;
    if (result.rows.length > 0) {
      const numStr = result.rows[0].employee_code.slice(prefix.length + separator.length);
      const num = parseInt(numStr, 10);
      if (!isNaN(num)) nextNumber = Math.max(nextNumber, num + 1);
    }

    const nextCode = `${prefix}${separator}${String(nextNumber).padStart(padding, '0')}`;

    res.json({
      prefix,
      separator,
      padding,
      counter,
      nextNumber,
      nextCode,
      autoGenerate: settings.autoGenerate,
      format: `${prefix}${separator}${'#'.repeat(padding)}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle boolean setting
const toggleSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const result = await settingService.toggleSetting(key);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "system_settings",
      record_id: null,
      new_values: { key, value: result.value },
      description: `System setting toggled: ${key} = ${result.value}`,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
  getNextEmployeeCode,
  toggleSetting,
};
