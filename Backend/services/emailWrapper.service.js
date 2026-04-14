// services/emailWrapper.service.js
const settingService = require("./setting.service");

// This service wraps the content with dynamic company branding
const wrapEmailWithDesign = async (content, subject = "") => {
  // Get all branding settings from database (await each Promise)
  const companyName = await settingService.getSetting("company_name");
  const companyLogo = await settingService.getSetting("company_logo");
  const companyAddress = await settingService.getSetting("company_address");
  const primaryColor =
    (await settingService.getSetting("primary_color")) || "#4F46E5";
  const secondaryColor =
    (await settingService.getSetting("secondary_color")) || "#7C3AED";
  const showPoweredBy = await settingService.getBoolSetting("show_powered_by");
  const showCompanyNameInEmail = await settingService.getBoolSetting(
    "email_show_company_name",
  );

  // Ensure content is a string, not a Promise
  const safeContent = String(content || "");

  // Build header content based on settings
  let headerContent = "";
  const currentYear = new Date().getFullYear();

  if (showCompanyNameInEmail && companyName) {
    headerContent = `
      <div class="company-name" style="font-size: 16px; color: rgba(255,255,255,0.9); margin-bottom: 8px;">
        ${companyName}
      </div>
      <div class="logo">
        <div class="logo-text">UnivoHR</div>
      </div>
    `;
  } else {
    headerContent = `
      <div class="logo">
        <div class="logo-text">UnivoHR</div>
      </div>
    `;
  }

  // Add company logo if exists
  const logoHtml = companyLogo
    ? `<img src="${companyLogo}" alt="${companyName || "UnivoHR"}" style="max-height: 50px; max-width: 200px;" />`
    : "";

  // Build footer content
  let footerContent = `
    <p>© ${currentYear} ${companyName || "UnivoHR"}. All rights reserved.</p>
  `;

  if (companyAddress) {
    footerContent += `<p class="company-info" style="font-size: 11px; color: #94a3b8;">${companyAddress}</p>`;
  }

  if (showPoweredBy) {
    footerContent += `<p>Powered by <strong>UnivoHR</strong></p>`;
  }

  footerContent += `
    <p>
      <a href="#">Privacy Policy</a> • 
      <a href="#">Terms of Service</a> • 
      <a href="#">Security</a>
    </p>
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || (companyName ? companyName + " Notification" : "UnivoHR Notification")}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 20px;
    }
    
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      padding: 32px 24px;
      text-align: center;
    }
    
    .logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    
    .logo-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }
    
    .logo-text {
      font-size: 28px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }
    
    .company-name {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 8px;
    }
    
    .header-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      margin-top: 8px;
    }
    
    .content {
      padding: 40px 32px;
    }
    
    .footer {
      padding: 24px 32px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    
    .footer p {
      color: #64748b;
      font-size: 12px;
      margin: 4px 0;
    }
    
    .footer a {
      color: ${primaryColor};
      text-decoration: none;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    .company-info {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 8px;
    }
    
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 20px 0;
    }
    
    @media (max-width: 480px) {
      .content {
        padding: 28px 20px;
      }
      .logo-text {
        font-size: 22px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoHtml}
      ${headerContent}
      <div class="header-subtitle">HR Management System</div>
    </div>
    
    <div class="content">
      ${safeContent}
      <hr />
      <p style="font-size: 13px; color: #475569; text-align: center; margin-top: 20px;">
        This is an automated message from ${companyName || "UnivoHR"}. Please do not reply to this email.
      </p>
    </div>
    
    <div class="footer">
      ${footerContent}
    </div>
  </div>
</body>
</html>`;
};

module.exports = { wrapEmailWithDesign };
