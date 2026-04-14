const emailTemplateService = require("../services/emailTemplate.service");

// Get all templates
const getAllTemplates = async (req, res) => {
  try {
    const templates = await emailTemplateService.getAllTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get template by type
const getTemplateByType = async (req, res) => {
  try {
    const { type } = req.params;
    const template = await emailTemplateService.getTemplateByType(type);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or update template
const upsertTemplate = async (req, res) => {
  try {
    const { type, subject, body_html } = req.body;
    const userId = req.user.id;
    const template = await emailTemplateService.upsertTemplate(
      type,
      subject,
      body_html,
      userId,
    );
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update template
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body_html, is_active } = req.body;
    const userId = req.user.id;
    const template = await emailTemplateService.updateTemplate(
      id,
      subject,
      body_html,
      is_active,
      userId,
    );
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle template active status
const toggleTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const userId = req.user.id;
    const template = await emailTemplateService.toggleTemplate(
      id,
      is_active,
      userId,
    );
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete template
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await emailTemplateService.deleteTemplate(id);
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTemplates,
  getTemplateByType,
  upsertTemplate,
  updateTemplate,
  toggleTemplate,
  deleteTemplate,
};
