const settingService = require("../services/setting.service");

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
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle boolean setting
const toggleSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const result = await settingService.toggleSetting(key);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
  toggleSetting,
};
