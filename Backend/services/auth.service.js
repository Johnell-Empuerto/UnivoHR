const authModel = require("../models/auth.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const redisClient = require("../config/redis");
const settingService = require("./setting.service");
const otpService = require("./otp.service");
const loginAttemptService = require("./loginAttempt.service");
const userService = require("./user.service");

// Validate JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
const JWT_SECRET = process.env.JWT_SECRET;

//Anti-brute-force delay
const addDelay = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
};

// Normalize username
const normalizeUsername = (username) => {
  return username.toLowerCase().trim();
};

// Step 1: Initial login - returns if 2FA is required
const login = async ({ username, password }) => {
  const normalizedUsername = normalizeUsername(username);

  //Check if account is locked
  const isLocked =
    await loginAttemptService.isAccountLocked(normalizedUsername);
  if (isLocked) {
    const remainingTime =
      await loginAttemptService.getLockoutTimeRemaining(normalizedUsername);
    throw new Error(
      `Account is locked. Please try again in ${Math.ceil(remainingTime / 60)} minutes.`,
    );
  }

  // Try Redis first with normalized username
  const cachedUser = await redisClient.get(`user:${normalizedUsername}`);

  let user;

  if (cachedUser) {
    console.log("⚡ User from Redis");
    user = JSON.parse(cachedUser);
  } else {
    console.log("User from DB");
    user = await authModel.findUserByUsername(normalizedUsername);

    if (user) {
      await redisClient.setEx(
        `user:${normalizedUsername}`,
        300,
        JSON.stringify(user),
      );
    }
  }

  // IMPORTANT: Prevent user enumeration - same error message for user not found OR wrong password
  let isMatch = false;

  if (user) {
    isMatch = await bcrypt.compare(password, user.password_hash);
  }

  if (!user || !isMatch) {
    // Track failed attempt
    await loginAttemptService.trackFailedAttempt(normalizedUsername);
    // Add delay to prevent timing attacks
    await addDelay();
    throw new Error("Invalid credentials");
  }

  // Reset login attempts on successful login
  await loginAttemptService.resetLoginAttempts(normalizedUsername);

  // Check if 2FA is enabled
  const is2FAEnabled = await settingService.getBoolSetting(
    "enable_2fa_login_email",
  );

  if (is2FAEnabled) {
    const userEmail = user.email;
    if (!userEmail) {
      throw new Error("Invalid credentials");
    }

    const otp = otpService.generateOTP();
    await otpService.storeOTP(user.id, userEmail, otp);

    const userName =
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.username;
    await otpService.sendOTPEmail(userEmail, otp, userName);

    return {
      requires_2fa: true,
      user_id: user.id,
      masked_email: otpService.maskEmail(userEmail),
      message: "OTP sent to your email",
    };
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      employee_id: user.employee_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "1d" },
  );

  await redisClient.setEx(`session:${user.id}`, 86400, token);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      employee_id: user.employee_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    },
    requires_2fa: false,
  };
};

// Step 2: Verify OTP and complete login
const verifyOTPAndLogin = async ({ user_id, otp }) => {
  const verification = await otpService.verifyOTP(user_id, otp);

  if (!verification.success) {
    throw new Error(verification.message);
  }

  const user = await authModel.findUserById(user_id);
  if (!user) throw new Error("User not found");

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      employee_id: user.employee_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "1d" },
  );

  await redisClient.setEx(`session:${user.id}`, 86400, token);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      employee_id: user.employee_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    },
    requires_2fa: false,
  };
};

// Resend OTP
const resendOTP = async ({ user_id }) => {
  const user = await authModel.findUserById(user_id);
  if (!user) throw new Error("User not found");

  const userEmail = user.email;
  if (!userEmail) {
    throw new Error("User email not configured. Please contact HR.");
  }

  const userName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;

  const result = await otpService.resendOTP(user_id, userEmail, userName);
  return result;
};

// Forgot Password - Send OTP to user's email
const forgotPassword = async ({ username }) => {
  const normalizedUsername = normalizeUsername(username);

  const user = await authModel.findUserByUsername(normalizedUsername);
  if (!user) {
    // Don't reveal if user exists or not - security best practice
    return {
      success: true,
      message: "If an account exists with this username, a reset code has been sent.",
    };
  }

  const userEmail = user.email;
  if (!userEmail) {
    return {
      success: true,
      message: "If an account exists with this username, a reset code has been sent.",
    };
  }

  const userName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;

  // Generate and store OTP for password reset
  const otp = otpService.generateOTP();
  await otpService.storePasswordResetOTP(user.id, userEmail, otp);

  // Send email
  await otpService.sendPasswordResetEmail(userEmail, otp, userName);

  return {
    success: true,
    message: "If an account exists with this username, a reset code has been sent.",
    user_id: user.id,
    masked_email: otpService.maskEmail(userEmail),
  };
};

// Verify reset OTP and reset password
const resetPassword = async ({ user_id, otp, new_password }) => {
  // Verify the OTP
  const verification = await otpService.verifyPasswordResetOTP(user_id, otp);
  if (!verification.success) {
    throw new Error(verification.message);
  }

  // Validate new password
  if (!new_password || new_password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  // Reset password
  await userService.resetPassword(user_id, new_password);

  // Delete the OTP after successful reset
  await otpService.deletePasswordResetOTP(user_id);

  return {
    success: true,
    message: "Password reset successfully. Please login with your new password.",
  };
};

module.exports = {
  login,
  verifyOTPAndLogin,
  resendOTP,
  forgotPassword,
  resetPassword,
};
