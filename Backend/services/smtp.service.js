const smtpModel = require("../models/smtp.model");
const nodemailer = require("nodemailer");

const getSmtpSettings = async () => {
  return await smtpModel.getSmtpSettings();
};

const getAllSmtpSettings = async () => {
  return await smtpModel.getAllSmtpSettings();
};

const createSmtpSettings = async (data) => {
  // Validate required fields
  if (!data.host) throw new Error("Host is required");
  if (!data.port) throw new Error("Port is required");
  if (!data.username) throw new Error("Username is required");
  if (!data.password) throw new Error("Password is required");
  if (!data.from_email) throw new Error("From email is required");

  return await smtpModel.createSmtpSettings(data);
};

const updateSmtpSettings = async (id, data) => {
  const existing = await smtpModel.getSmtpSettingsById(id);
  if (!existing) throw new Error("SMTP settings not found");

  return await smtpModel.updateSmtpSettings(id, data);
};

const deleteSmtpSettings = async (id) => {
  const existing = await smtpModel.getSmtpSettingsById(id);
  if (!existing) throw new Error("SMTP settings not found");

  return await smtpModel.deleteSmtpSettings(id);
};

const testSmtpConnection = async (id, testEmail) => {
  const smtp = await smtpModel.getSmtpSettingsById(id);
  if (!smtp) throw new Error("SMTP settings not found");

  console.log("[TEST] Testing SMTP:", {
    host: smtp.host,
    port: smtp.port,
    encryption: smtp.encryption,
    username: smtp.username,
    from_email: smtp.from_email,
  });

  // FIXED: Handle encryption properly
  let secure = false;
  if (smtp.encryption === "ssl") {
    secure = true;
  } else if (smtp.encryption === "tls") {
    secure = false;
  } else if (smtp.encryption === "none") {
    secure = false;
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: secure,
    auth: {
      user: smtp.username,
      pass: smtp.password,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  // Verify connection
  await transporter.verify();
  console.log("[TEST] SMTP verification successful");

  // Send test email
  const mailOptions = {
    from: `"${smtp.from_name || "SMTP Test"}" <${smtp.from_email}>`,
    to: testEmail,
    subject: "SMTP Configuration Test",
    html: `
      <h2>SMTP Configuration Test</h2>
      <p>This is a test email to verify your SMTP settings are working correctly.</p>
      <p><strong>Configuration:</strong></p>
      <ul>
        <li>Host: ${smtp.host}</li>
        <li>Port: ${smtp.port}</li>
        <li>Encryption: ${smtp.encryption}</li>
        <li>From: ${smtp.from_email}</li>
      </ul>
      <p>If you received this email, your SMTP settings are configured correctly!</p>
      <hr/>
      <p style="color: #666; font-size: 12px;">Sent from your HRMS System</p>
    `,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(" [TEST] Test email sent, messageId:", result.messageId);

  // Update test email status
  await smtpModel.updateTestEmailStatus(id, true);

  return { success: true, message: "Test email sent successfully" };
};

// FIXED: Main sendEmail function with proper error handling
const sendEmail = async (to, subject, html, attachments = []) => {
  console.log("[SEND] Getting SMTP settings...");
  const smtp = await smtpModel.getSmtpSettings();

  if (!smtp) {
    console.error("[SEND] No SMTP settings found");
    throw new Error("SMTP settings not configured");
  }

  console.log("[SEND] SMTP Config:", {
    host: smtp.host,
    port: smtp.port,
    encryption: smtp.encryption,
    username: smtp.username ? `${smtp.username.substring(0, 5)}...` : "MISSING",
    hasPassword: !!smtp.password,
    from_email: smtp.from_email,
    from_name: smtp.from_name,
    is_active: smtp.is_active,
  });

  // Validate credentials
  if (!smtp.username || !smtp.password) {
    console.error("[SEND] Missing credentials - username or password is empty");
    throw new Error(
      "SMTP credentials missing. Please check your SMTP settings.",
    );
  }

  // Handle encryption properly
  let secure = false;
  if (smtp.encryption === "ssl") {
    secure = true;
    console.log("[SEND] Using SSL encryption");
  } else if (smtp.encryption === "tls") {
    secure = false;
    console.log("[SEND] Using TLS encryption");
  } else if (smtp.encryption === "none") {
    secure = false;
    console.log("[SEND] Using no encryption");
  }

  const transporterConfig = {
    host: smtp.host,
    port: smtp.port,
    secure: secure,
    auth: {
      user: smtp.username,
      pass: smtp.password,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  };

  console.log("[SEND] Creating transporter with config:", {
    host: transporterConfig.host,
    port: transporterConfig.port,
    secure: transporterConfig.secure,
    auth_user_set: !!transporterConfig.auth.user,
    auth_pass_set: !!transporterConfig.auth.pass,
  });

  const transporter = nodemailer.createTransport(transporterConfig);

  const mailOptions = {
    from: `"${smtp.from_name || "HRMS System"}" <${smtp.from_email}>`,
    to,
    subject,
    html,
    attachments,
  };

  console.log(" [SEND] Mail options:", {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
    htmlLength: html?.length || 0,
  });

  try {
    console.log("[SEND] Attempting to send email...");
    const result = await transporter.sendMail(mailOptions);
    console.log(
      " [SEND] Email sent successfully! Message ID:",
      result.messageId,
    );
    return result;
  } catch (error) {
    console.error("[SEND] Failed to send email:", error.message);
    console.error("[SEND] Error code:", error.code);
    console.error("[SEND] Error command:", error.command);
    console.error("[SEND] Error response:", error.response);

    // Throw a user-friendly error
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

module.exports = {
  getSmtpSettings,
  getAllSmtpSettings,
  createSmtpSettings,
  updateSmtpSettings,
  deleteSmtpSettings,
  testSmtpConnection,
  sendEmail,
};
