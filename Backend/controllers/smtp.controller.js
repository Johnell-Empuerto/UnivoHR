const smtpService = require("../services/smtp.service");

// Get active SMTP settings
const getSmtpSettings = async (req, res) => {
  try {
    const data = await smtpService.getSmtpSettings();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all SMTP settings
const getAllSmtpSettings = async (req, res) => {
  try {
    const data = await smtpService.getAllSmtpSettings();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create SMTP settings
const createSmtpSettings = async (req, res) => {
  try {
    const data = await smtpService.createSmtpSettings(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update SMTP settings
const updateSmtpSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await smtpService.updateSmtpSettings(id, req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete SMTP settings
const deleteSmtpSettings = async (req, res) => {
  try {
    const { id } = req.params;
    await smtpService.deleteSmtpSettings(id);
    res.json({ message: "SMTP settings deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Test SMTP connection
const testSmtpConnection = async (req, res) => {
  try {
    const { id, test_email } = req.body;
    const result = await smtpService.testSmtpConnection(id, test_email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSmtpSettings,
  getAllSmtpSettings,
  createSmtpSettings,
  updateSmtpSettings,
  deleteSmtpSettings,
  testSmtpConnection,
};
