const smtpService = require("../services/smtp.service");
const audit = require("../services/audit.service");

// Get active SMTP settings
const getSmtpSettings = async (req, res, next) => {
  try {
    const data = await smtpService.getSmtpSettings();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Get all SMTP settings
const getAllSmtpSettings = async (req, res, next) => {
  try {
    const data = await smtpService.getAllSmtpSettings();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Create SMTP settings
const createSmtpSettings = async (req, res, next) => {
  try {
    const data = await smtpService.createSmtpSettings(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "smtp_settings",
      record_id: data.id,
      new_values: { host: data.host, port: data.port, from_email: data.from_email, is_active: data.is_active },
      description: `SMTP settings created: ${data.host}:${data.port}`,
    });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// Update SMTP settings
const updateSmtpSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await smtpService.updateSmtpSettings(id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "smtp_settings",
      record_id: Number(id),
      new_values: { host: data.host, port: data.port, from_email: data.from_email, is_active: data.is_active },
      description: `SMTP settings updated: ${data.host}:${data.port}`,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Delete SMTP settings
const deleteSmtpSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    await smtpService.deleteSmtpSettings(id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "smtp_settings",
      record_id: Number(id),
      description: `SMTP settings deleted (id: ${id})`,
    });
    res.json({ message: "SMTP settings deleted successfully" });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: error.message,
        dependencies: error.dependencies,
      });
    }
    next(error);
  }
};

// Test SMTP connection
const testSmtpConnection = async (req, res, next) => {
  try {
    const { id, test_email } = req.body;
    const result = await smtpService.testSmtpConnection(id, test_email);
    res.json(result);
  } catch (error) {
    next(error);
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
