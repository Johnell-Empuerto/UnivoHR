const smtpService = require("./smtp.service");
const redisClient = require("../config/redis");
const {
  buildStandaloneTransactionalEmail,
  buildLoginOtpBody,
  buildPasswordResetOtpBody,
} = require("../utils/emailDesign");

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Mask email for display
const maskEmail = (email) => {
  if (!email) return "your email";
  if (!email.includes("@")) return "your email";

  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  if (local.length <= 3) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
};

// Store OTP in Redis with expiration (default 5 minutes) and rate limit check
const storeOTP = async (userId, email, otp, expirationSeconds = 300) => {
  const key = `otp:${userId}`;

  const existing = await redisClient.get(key);
  if (existing) {
    const data = JSON.parse(existing);
    const elapsed = (Date.now() - new Date(data.created_at).getTime()) / 1000;
    if (elapsed < 60) {
      throw new Error("Please wait 60 seconds before requesting another OTP");
    }
  }

  await redisClient.setEx(
    key,
    expirationSeconds,
    JSON.stringify({
      otp,
      email,
      attempts: 0,
      created_at: new Date().toISOString(),
      purpose: "login", // Default purpose
    }),
  );
  return true;
};

// Store password reset OTP in Redis with 3-minute expiration
const storePasswordResetOTP = async (userId, email, otp) => {
  const key = `pwd_reset:${userId}`;

  const existing = await redisClient.get(key);
  if (existing) {
    const data = JSON.parse(existing);
    const elapsed = (Date.now() - new Date(data.created_at).getTime()) / 1000;
    if (elapsed < 60) {
      throw new Error("Please wait 60 seconds before requesting another code");
    }
  }

  await redisClient.setEx(
    key,
    180, // 3 minutes expiration
    JSON.stringify({
      otp,
      email,
      attempts: 0,
      created_at: new Date().toISOString(),
      purpose: "password_reset",
    }),
  );
  return true;
};

// Verify password reset OTP
const verifyPasswordResetOTP = async (userId, userOTP) => {
  const key = `pwd_reset:${userId}`;
  const data = await redisClient.get(key);

  if (!data) {
    return {
      success: false,
      message: "Reset code expired. Please request a new code.",
    };
  }

  const stored = JSON.parse(data);

  if (stored.attempts >= 5) {
    await redisClient.del(key);
    return {
      success: false,
      message: "Too many failed attempts. Please request a new code.",
    };
  }

  if (stored.otp !== userOTP) {
    stored.attempts++;
    const ttl = await redisClient.ttl(key);
    await redisClient.setEx(
      `pwd_reset:${userId}`,
      ttl > 0 ? ttl : 180,
      JSON.stringify(stored),
    );

    const remainingAttempts = 5 - stored.attempts;
    return {
      success: false,
      message:
        remainingAttempts > 0
          ? `Invalid code. ${remainingAttempts} attempt${remainingAttempts > 1 ? "s" : ""} remaining.`
          : "No attempts remaining. Please request a new code.",
    };
  }

  return { success: true, message: "Code verified successfully" };
};

// Delete password reset OTP
const deletePasswordResetOTP = async (userId) => {
  const key = `pwd_reset:${userId}`;
  await redisClient.del(key);
};

// Send password reset email
const sendPasswordResetEmail = async (email, otp, userName) => {
  console.log("[PWD RESET] Preparing to send reset email to:", email);
  console.log("[PWD RESET] OTP code:", otp);
  console.log("[PWD RESET] User name:", userName);

  const subject = "Password Reset Verification - UnivoHR";

  const html = buildStandaloneTransactionalEmail({
    subject,
    headerSubtitle: "Password Reset Verification",
    headerVariant: "alert",
    bodyHtml: buildPasswordResetOtpBody(otp, userName),
  });

  try {
    console.log("[PWD RESET] HTML length:", html.length);
    console.log("[PWD RESET] Calling smtpService.sendEmail...");
    const result = await smtpService.sendEmail(email, subject, html);
    console.log(
      "[PWD RESET] Password reset email sent successfully, messageId:",
      result.messageId,
    );
    return result;
  } catch (err) {
    console.error("[PWD RESET] Failed to send reset email:", err.message);
    console.error("[PWD RESET] Full error:", err);
    throw new Error(`Failed to send password reset email: ${err.message}`);
  }
};

// Get OTP with TTL in one Redis call
const getOTPWithTTL = async (userId) => {
  const key = `otp:${userId}`;
  const [data, ttl] = await Promise.all([
    redisClient.get(key),
    redisClient.ttl(key),
  ]);

  return {
    data: data ? JSON.parse(data) : null,
    ttl: ttl > 0 ? ttl : 0,
  };
};

// Get OTP from Redis
const getOTP = async (userId) => {
  const key = `otp:${userId}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

// Verify OTP
const verifyOTP = async (userId, userOTP) => {
  const { data: stored, ttl: remainingTTL } = await getOTPWithTTL(userId);

  if (!stored) {
    return {
      success: false,
      message: "OTP expired. Please request a new code.",
    };
  }

  if (stored.attempts >= 5) {
    await redisClient.del(`otp:${userId}`);
    return {
      success: false,
      message: "Too many failed attempts. Please request a new OTP.",
    };
  }

  if (stored.otp !== userOTP) {
    stored.attempts++;
    const ttl = remainingTTL > 0 ? remainingTTL : 300;
    await redisClient.setEx(`otp:${userId}`, ttl, JSON.stringify(stored));

    const remainingAttempts = 5 - stored.attempts;
    return {
      success: false,
      message:
        remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts > 1 ? "s" : ""} remaining.`
          : "No attempts remaining. Please request a new OTP.",
    };
  }

  await redisClient.del(`otp:${userId}`);
  return { success: true, message: "OTP verified successfully" };
};

// Delete OTP
const deleteOTP = async (userId) => {
  const key = `otp:${userId}`;
  await redisClient.del(key);
};

// Resend OTP with rate limit
const resendOTP = async (userId, email, userName) => {
  const otp = generateOTP();
  await storeOTP(userId, email, otp);
  await sendOTPEmail(email, otp, userName);
  return { success: true, message: "New OTP sent to your email" };
};

// Get masked email for frontend
const getMaskedEmail = async (userId) => {
  const stored = await getOTP(userId);
  if (stored && stored.email) {
    return maskEmail(stored.email);
  }
  return null;
};

const sendOTPEmail = async (email, otp, userName) => {
  const subject = "Login Verification Code - UnivoHR";

  const html = buildStandaloneTransactionalEmail({
    subject,
    headerSubtitle: "Secure Login Verification",
    headerVariant: "default",
    bodyHtml: buildLoginOtpBody(otp, userName),
  });

  try {
    console.log("[OTP] Calling smtpService.sendEmail...");
    const result = await smtpService.sendEmail(email, subject, html);
    console.log(
      "[OTP] OTP email sent successfully, messageId:",
      result.messageId,
    );
    return result;
  } catch (err) {
    console.error("[OTP] Failed to send OTP email:", err.message);
    console.error("[OTP] Full error:", err);
    throw new Error(`Failed to send OTP email: ${err.message}`);
  }
};

module.exports = {
  generateOTP,
  storeOTP,
  getOTP,
  verifyOTP,
  deleteOTP,
  sendOTPEmail,
  resendOTP,
  maskEmail,
  getMaskedEmail,
  // Password reset functions
  storePasswordResetOTP,
  verifyPasswordResetOTP,
  deletePasswordResetOTP,
  sendPasswordResetEmail,
};
