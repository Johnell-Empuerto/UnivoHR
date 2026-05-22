// services/emailWrapper.service.js
const settingService = require("./setting.service");
const { buildBrandedEmailDocument } = require("../utils/emailDesign");

// Wraps template content with dynamic company branding (visual layout only)
const wrapEmailWithDesign = async (content, subject = "") => {
  const companyName = await settingService.getSetting("company_name");
  const companyLogo = await settingService.getSetting("company_logo");
  const companyAddress = await settingService.getSetting("company_address");
  const primaryColor =
    (await settingService.getSetting("primary_color")) || "#18181b";
  const secondaryColor =
    (await settingService.getSetting("secondary_color")) || "#3f3f46";
  const showPoweredBy = await settingService.getBoolSetting("show_powered_by");
  const showCompanyNameInEmail = await settingService.getBoolSetting(
    "email_show_company_name",
  );

  const safeContent = String(content || "");

  return buildBrandedEmailDocument({
    subject,
    branding: {
      companyName,
      companyLogo,
      companyAddress,
      primaryColor,
      secondaryColor,
      showPoweredBy,
      showCompanyNameInEmail,
    },
    headerSubtitle: "HR Management System",
    bodyHtml: safeContent,
    showAutomatedDisclaimer: true,
  });
};

module.exports = { wrapEmailWithDesign };
