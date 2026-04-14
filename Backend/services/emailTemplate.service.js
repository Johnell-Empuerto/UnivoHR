// services/emailTemplate.service.js
const emailTemplateModel = require("../models/emailTemplate.model");
const { wrapEmailWithDesign } = require("./emailWrapper.service");

// Apply template variables
const applyTemplate = (html, data) => {
  let result = html;
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    const value = data[key] || "";
    result = result.replace(regex, value);
  });
  return result;
};

// Get all templates
const getAllTemplates = async () => {
  return await emailTemplateModel.getAllTemplates();
};

// Get template by type
const getTemplateByType = async (type) => {
  return await emailTemplateModel.getTemplateByType(type);
};

// Get active template by type
const getActiveTemplateByType = async (type) => {
  return await emailTemplateModel.getActiveTemplateByType(type);
};

// Create or update template
const upsertTemplate = async (type, subject, body_html, userId) => {
  if (!type || !subject || !body_html) {
    throw new Error("Type, subject, and body_html are required");
  }
  return await emailTemplateModel.upsertTemplate(
    type,
    subject,
    body_html,
    userId,
  );
};

// Update template
const updateTemplate = async (id, subject, body_html, is_active, userId) => {
  return await emailTemplateModel.updateTemplate(
    id,
    subject,
    body_html,
    is_active,
    userId,
  );
};

// Toggle template
const toggleTemplate = async (id, is_active, userId) => {
  return await emailTemplateModel.toggleTemplate(id, is_active, userId);
};

// Delete template
const deleteTemplate = async (id) => {
  return await emailTemplateModel.deleteTemplate(id);
};

// Render email with template - CONTENT ONLY, then wrap with design
const renderEmail = async (type, data) => {
  const template = await emailTemplateModel.getActiveTemplateByType(type);
  if (!template) {
    throw new Error(`No active template found for type: ${type}`);
  }

  // Apply variables to content only (ensure it's a string)
  let content = applyTemplate(template.body_html || "", data);
  let subject = applyTemplate(template.subject || "", data);

  // Ensure content is a string, not undefined
  content = content || "";
  subject = subject || "";

  console.log(`Rendering template: ${type}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content length: ${content.length}`);

  // Wrap content with full email design (await the async function)
  const html = await wrapEmailWithDesign(content, subject);

  return { subject, html };
};

module.exports = {
  getAllTemplates,
  getTemplateByType,
  getActiveTemplateByType,
  upsertTemplate,
  updateTemplate,
  toggleTemplate,
  deleteTemplate,
  applyTemplate,
  renderEmail,
};
