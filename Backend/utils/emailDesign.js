/**
 * Shared email layout & styles for UnivoHR transactional emails.
 * Visual-only utilities — placeholders and branding keys unchanged.
 */

const DEFAULT_PRIMARY = "#18181b";
const DEFAULT_SECONDARY = "#3f3f46";

/**
 * @param {{ primaryColor?: string, secondaryColor?: string }} branding
 */
const getBaseStyles = (branding = {}) => {
  const primary = branding.primaryColor || DEFAULT_PRIMARY;
  const secondary = branding.secondaryColor || DEFAULT_SECONDARY;

  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #18181b;
      background-color: #f4f4f5;
      -webkit-font-smoothing: antialiased;
      padding: 24px 16px;
      width: 100% !important;
    }
    .email-outer {
      max-width: 600px;
      margin: 0 auto;
    }
    .email-card {
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.04);
    }
    .email-header {
      background-color: ${primary};
      padding: 28px 32px;
      text-align: center;
    }
    .email-header--alert {
      background-color: #b91c1c;
    }
    .email-header-logo {
      margin-bottom: 12px;
    }
    .email-header-logo img {
      max-height: 48px;
      max-width: 200px;
      display: inline-block;
    }
    .email-company-name {
      font-size: 13px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.88);
      letter-spacing: 0.02em;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .email-brand-mark {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.03em;
      line-height: 1.2;
    }
    .email-header-subtitle {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.82);
      margin-top: 10px;
      font-weight: 400;
    }
    .email-body {
      padding: 36px 32px 28px;
    }
    .email-content-inner {
      font-size: 15px;
      line-height: 1.65;
      color: #3f3f46;
    }
    .email-content-inner h1,
    .email-content-inner h2,
    .email-content-inner h3 {
      color: #18181b;
      font-weight: 600;
      margin: 0 0 12px;
      line-height: 1.35;
    }
    .email-content-inner h1 { font-size: 22px; }
    .email-content-inner h2 { font-size: 18px; }
    .email-content-inner h3 { font-size: 16px; }
    .email-content-inner p {
      margin: 0 0 16px;
    }
    .email-content-inner p:last-child { margin-bottom: 0; }
    .email-content-inner strong { color: #18181b; font-weight: 600; }
    .email-content-inner ul,
    .email-content-inner ol {
      margin: 0 0 16px 20px;
      padding: 0;
    }
    .email-content-inner li { margin-bottom: 6px; }
    .email-content-inner a {
      color: ${primary};
      text-decoration: underline;
    }
    .email-content-inner hr {
      border: none;
      border-top: 1px solid #e4e4e7;
      margin: 24px 0;
    }
    .email-content-inner table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
    }
    .email-content-inner th,
    .email-content-inner td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e4e4e7;
    }
    .email-content-inner th {
      background: #fafafa;
      color: #52525b;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .email-greeting {
      font-size: 20px;
      font-weight: 600;
      color: #18181b;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    .email-lead {
      font-size: 15px;
      color: #52525b;
      margin-bottom: 24px;
      line-height: 1.65;
    }
    .email-detail-card {
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 10px;
      padding: 20px 22px;
      margin: 20px 0;
    }
    .email-detail-row {
      display: block;
      padding: 10px 0;
      border-bottom: 1px solid #e4e4e7;
      font-size: 14px;
    }
    .email-detail-row:last-child { border-bottom: none; padding-bottom: 0; }
    .email-detail-row:first-child { padding-top: 0; }
    .email-detail-label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #71717a;
      margin-bottom: 4px;
    }
    .email-detail-value {
      color: #18181b;
      font-weight: 500;
    }
    .email-status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .email-status-badge--approved {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .email-status-badge--rejected {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .email-status-badge--pending {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .email-status-badge--info {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .email-btn {
      display: inline-block;
      background-color: ${primary};
      color: #ffffff !important;
      padding: 12px 28px;
      border-radius: 8px;
      text-decoration: none !important;
      font-weight: 600;
      font-size: 14px;
      margin: 8px 0 4px;
      text-align: center;
    }
    .email-btn:hover { opacity: 0.92; }
    .email-callout {
      border-radius: 10px;
      padding: 14px 18px;
      margin: 20px 0;
      font-size: 13px;
      line-height: 1.55;
    }
    .email-callout--info {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }
    .email-callout--warning {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      color: #991b1b;
    }
    .email-callout--success {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      color: #065f46;
    }
    .email-callout p { margin: 0; }
    .email-otp-panel {
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      padding: 28px 24px;
      text-align: center;
      margin: 24px 0;
    }
    .email-otp-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #71717a;
      margin-bottom: 14px;
    }
    .email-otp-code {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 0.35em;
      color: ${primary};
      font-family: 'SF Mono', 'Consolas', 'Courier New', monospace;
      background: #ffffff;
      display: inline-block;
      padding: 14px 28px;
      border-radius: 10px;
      border: 1px solid #e4e4e7;
      line-height: 1;
    }
    .email-otp-panel--alert .email-otp-code {
      color: #b91c1c;
      letter-spacing: 0.28em;
    }
    .email-otp-expiry {
      margin-top: 14px;
      font-size: 13px;
      color: #71717a;
      font-weight: 500;
    }
    .email-divider {
      border: none;
      border-top: 1px solid #e4e4e7;
      margin: 28px 0;
    }
    .email-disclaimer {
      font-size: 13px;
      color: #71717a;
      text-align: center;
      line-height: 1.5;
      margin-top: 8px;
    }
    .email-footer {
      padding: 22px 32px 26px;
      background: #fafafa;
      border-top: 1px solid #e4e4e7;
      text-align: center;
    }
    .email-footer p {
      color: #71717a;
      font-size: 12px;
      margin: 4px 0;
      line-height: 1.5;
    }
    .email-footer a {
      color: ${secondary};
      text-decoration: none;
      font-weight: 500;
    }
    .email-footer a:hover { text-decoration: underline; }
    .email-powered {
      margin-top: 8px;
      font-size: 11px;
      color: #a1a1aa;
    }
    @media only screen and (max-width: 520px) {
      body { padding: 12px 8px !important; }
      .email-header { padding: 24px 20px !important; }
      .email-body { padding: 28px 20px 22px !important; }
      .email-footer { padding: 20px !important; }
      .email-otp-code {
        font-size: 28px !important;
        letter-spacing: 0.2em !important;
        padding: 12px 16px !important;
      }
      .email-greeting { font-size: 18px !important; }
    }
  `;
};

/**
 * @param {{
 *   subject?: string;
 *   branding: {
 *     companyName?: string;
 *     companyLogo?: string;
 *     companyAddress?: string;
 *     primaryColor?: string;
 *     secondaryColor?: string;
 *     showPoweredBy?: boolean;
 *     showCompanyNameInEmail?: boolean;
 *   };
 *   headerSubtitle?: string;
 *   headerVariant?: 'default' | 'alert';
 *   bodyHtml: string;
 *   showAutomatedDisclaimer?: boolean;
 * }} options
 */
const buildBrandedEmailDocument = ({
  subject = "",
  branding,
  headerSubtitle = "HR Management System",
  headerVariant = "default",
  bodyHtml,
  showAutomatedDisclaimer = true,
}) => {
  const {
    companyName,
    companyLogo,
    companyAddress,
    primaryColor,
    secondaryColor,
    showPoweredBy,
    showCompanyNameInEmail,
  } = branding;

  const displayCompany = companyName || "UnivoHR";
  const currentYear = new Date().getFullYear();
  const safeContent = String(bodyHtml || "");
  const pageTitle =
    subject || (companyName ? `${companyName} Notification` : "UnivoHR Notification");

  const logoBlock = companyLogo
    ? `<div class="email-header-logo"><img src="${companyLogo}" alt="${displayCompany}" /></div>`
    : "";

  let brandBlock = "";
  if (showCompanyNameInEmail && companyName) {
    brandBlock = `
      <div class="email-company-name">${companyName}</div>
      <div class="email-brand-mark">UnivoHR</div>
    `;
  } else {
    brandBlock = `<div class="email-brand-mark">UnivoHR</div>`;
  }

  const headerClass =
    headerVariant === "alert" ? "email-header email-header--alert" : "email-header";

  let footerBlocks = `<p>© ${currentYear} ${displayCompany}. All rights reserved.</p>`;
  if (companyAddress) {
    footerBlocks += `<p>${companyAddress}</p>`;
  }
  if (showPoweredBy) {
    footerBlocks += `<p class="email-powered">Powered by <strong>UnivoHR</strong></p>`;
  }
  footerBlocks += `
    <p style="margin-top: 12px;">
      <a href="#">Privacy Policy</a> &nbsp;·&nbsp;
      <a href="#">Terms of Service</a> &nbsp;·&nbsp;
      <a href="#">Security</a>
    </p>
  `;

  const disclaimer = showAutomatedDisclaimer
    ? `<hr class="email-divider" />
       <p class="email-disclaimer">
         This is an automated message from ${displayCompany}. Please do not reply to this email.
       </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${pageTitle}</title>
  <style>${getBaseStyles({ primaryColor, secondaryColor })}</style>
</head>
<body>
  <div class="email-outer">
    <div class="email-card">
      <div class="${headerClass}">
        ${logoBlock}
        ${brandBlock}
        <p class="email-header-subtitle">${headerSubtitle}</p>
      </div>
      <div class="email-body">
        <div class="email-content-inner">
          ${safeContent}
        </div>
        ${disclaimer}
      </div>
      <div class="email-footer">
        ${footerBlocks}
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Standalone transactional email (OTP / password reset) — same visual system.
 * @param {{
 *   subject: string;
 *   headerSubtitle: string;
 *   headerVariant?: 'default' | 'alert';
 *   bodyHtml: string;
 *   footerYear?: number;
 * }} options
 */
const buildStandaloneTransactionalEmail = ({
  subject,
  headerSubtitle,
  headerVariant = "default",
  bodyHtml,
}) => {
  const currentYear = new Date().getFullYear();
  const safeContent = String(bodyHtml || "");
  const headerClass =
    headerVariant === "alert" ? "email-header email-header--alert" : "email-header";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <style>${getBaseStyles({ primaryColor: DEFAULT_PRIMARY, secondaryColor: DEFAULT_SECONDARY })}</style>
</head>
<body>
  <div class="email-outer">
    <div class="email-card">
      <div class="${headerClass}">
        <div class="email-brand-mark">UnivoHR</div>
        <p class="email-header-subtitle">${headerSubtitle}</p>
      </div>
      <div class="email-body">
        ${safeContent}
        <hr class="email-divider" />
        <p class="email-disclaimer">
          Need help? Contact your system administrator or HR department.
        </p>
      </div>
      <div class="email-footer">
        <p>© ${currentYear} UnivoHR. All rights reserved.</p>
        <p>This is an automated message, please do not reply.</p>
        <p style="margin-top: 12px;">
          <a href="#">Privacy Policy</a> &nbsp;·&nbsp;
          <a href="#">Terms of Service</a> &nbsp;·&nbsp;
          <a href="#">Security</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/** Login OTP email body */
const buildLoginOtpBody = (otp, userName) => `
  <p class="email-greeting">Hello, ${userName}!</p>
  <p class="email-lead">
    We received a request to log in to your UnivoHR account. Use the verification code below to complete your login.
  </p>
  <div class="email-otp-panel">
    <div class="email-otp-label">Verification Code</div>
    <div class="email-otp-code">${otp}</div>
    <p class="email-otp-expiry">This code will expire in <strong>5 minutes</strong></p>
  </div>
  <div class="email-callout email-callout--info">
    <p><strong>Security notice:</strong> If you did not request this code, ignore this email and ensure your account is secure. Never share this code with anyone.</p>
  </div>
`;

/** Password reset OTP email body */
const buildPasswordResetOtpBody = (otp, userName) => `
  <p class="email-greeting">Hello, ${userName}!</p>
  <p class="email-lead">
    We received a request to reset your UnivoHR account password. Use the verification code below on the password reset page along with your new password.
  </p>
  <div class="email-otp-panel email-otp-panel--alert">
    <div class="email-otp-label">Reset Code</div>
    <div class="email-otp-code">${otp}</div>
    <p class="email-otp-expiry">This code will expire in <strong>3 minutes</strong></p>
  </div>
  <div class="email-callout email-callout--info">
    <p><strong>Important:</strong> Enter this code on the password reset page along with your new password.</p>
  </div>
  <div class="email-callout email-callout--warning">
    <p><strong>Security notice:</strong> If you did not request this password reset, ignore this email and contact your administrator immediately.</p>
  </div>
`;

module.exports = {
  DEFAULT_PRIMARY,
  DEFAULT_SECONDARY,
  getBaseStyles,
  buildBrandedEmailDocument,
  buildStandaloneTransactionalEmail,
  buildLoginOtpBody,
  buildPasswordResetOtpBody,
};
