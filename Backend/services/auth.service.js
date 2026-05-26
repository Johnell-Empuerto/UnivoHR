const authModel = require("../models/auth.model");
const sessionModel = require("../models/session.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const settingService = require("./setting.service");
const otpService = require("./otp.service");
const loginAttemptService = require("./loginAttempt.service");
const userService = require("./user.service");
const userCacheService = require("./userCache.service");
const redisClient = require("../config/redis");
const tokenBlacklist = require("./tokenBlacklist.service");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m";
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60;
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;
const MAX_ACTIVE_SESSIONS = 5;

const addDelay = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
};

const normalizeUsername = userCacheService.normalizeUsername;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const generateAccessToken = (user) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      employee_id: user.employee_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      type: "access",
      jti,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
  return { token, jti, expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS };
};

const buildUserResponse = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role,
  employee_id: user.employee_id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
});

const enforceMaxSessions = async (userId) => {
  const count = await sessionModel.countActiveSessions(userId);
  if (count >= MAX_ACTIVE_SESSIONS) {
    const oldest = await sessionModel.getOldestActiveSession(userId);
    if (oldest) await sessionModel.deactivateSession(oldest.id);
  }
};

const createSessionAndIssueTokens = async (user, reqInfo) => {
  await enforceMaxSessions(user.id);

  const access = generateAccessToken(user);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000);
  const session = await sessionModel.createSession({
    user_id: user.id,
    refresh_token_hash: "pending",
    ip_address: reqInfo?.ip || "",
    user_agent: reqInfo?.userAgent || "",
    expires_at: expiresAt,
  });

  const refreshTokenStr = jwt.sign(
    { id: user.id, type: "refresh", jti: session.id },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );

  await sessionModel.updateSessionHash(session.id, hashToken(refreshTokenStr));

  return { accessToken: access.token, refreshToken: refreshTokenStr, user: buildUserResponse(user) };
};

const login = async ({ username, password }, reqInfo) => {
  const normalizedUsername = normalizeUsername(username);

  const isLocked = await loginAttemptService.isAccountLocked(normalizedUsername);
  if (isLocked) {
    const remainingTime = await loginAttemptService.getLockoutTimeRemaining(normalizedUsername);
    throw new Error(
      `Account is locked. Please try again in ${Math.ceil(remainingTime / 60)} minutes.`,
    );
  }

  const cachedUser = await redisClient.get(`user:${normalizedUsername}`);

  let user;
  if (cachedUser) {
    user = JSON.parse(cachedUser);
  } else {
    user = await authModel.findUserByUsername(normalizedUsername);
  }

  let isMatch = false;
  if (user) {
    isMatch = await bcrypt.compare(password, user.password_hash);
  }

  if (!user || !isMatch) {
    await loginAttemptService.trackFailedAttempt(normalizedUsername);
    await addDelay();
    throw new Error("Invalid credentials");
  }

  if (!cachedUser) {
    await userCacheService.cacheUserForLogin(normalizedUsername, user);
  }

  await loginAttemptService.resetLoginAttempts(normalizedUsername);

  const is2FAEnabled = await settingService.getBoolSetting("enable_2fa_login_email");

  if (is2FAEnabled) {
    const userEmail = user.email;
    if (!userEmail) {
      throw new Error("Invalid credentials");
    }

    const otp = otpService.generateOTP();
    await otpService.storeOTP(user.id, userEmail, otp);

    const userName =
      `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;
    await otpService.sendOTPEmail(userEmail, otp, userName);

    return {
      requires_2fa: true,
      user_id: user.id,
      masked_email: otpService.maskEmail(userEmail),
      message: "OTP sent to your email",
    };
  }

  const tokens = await createSessionAndIssueTokens(user, reqInfo);

  return {
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: tokens.user,
    requires_2fa: false,
  };
};

const verifyOTPAndLogin = async ({ user_id, otp }, reqInfo) => {
  const verification = await otpService.verifyOTP(user_id, otp);
  if (!verification.success) {
    throw new Error(verification.message);
  }

  const user = await authModel.findUserById(user_id);
  if (!user) throw new Error("User not found");

  const tokens = await createSessionAndIssueTokens(user, reqInfo);

  return {
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: tokens.user,
    requires_2fa: false,
  };
};

const refreshToken = async (refreshTokenStr, reqInfo) => {
  if (!refreshTokenStr) {
    throw new Error("Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshTokenStr, JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error("Refresh token expired, please login again");
    }
    throw new Error("Invalid refresh token");
  }

  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }

  const sessionId = decoded.jti;
  const userId = decoded.id;

  const session = await sessionModel.findActiveSession(sessionId, userId);
  if (!session) {
    throw new Error("Session not found or already revoked");
  }

  if (new Date(session.expires_at) < new Date()) {
    await sessionModel.deactivateSession(sessionId);
    throw new Error("Session expired, please login again");
  }

  const tokenHash = hashToken(refreshTokenStr);
  if (tokenHash !== session.refresh_token_hash) {
    await sessionModel.deactivateSession(sessionId);
    throw new Error("Refresh token has been revoked");
  }

  await sessionModel.deactivateSession(sessionId);

  const user = await authModel.findUserById(userId);
  if (!user) throw new Error("User not found");

  const tokens = await createSessionAndIssueTokens(user, reqInfo);

  return {
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const logout = async (accessJti, accessExp, refreshTokenStr) => {
  if (accessJti && accessExp) {
    const ttl = accessExp - Math.floor(Date.now() / 1000);
    await tokenBlacklist.blacklistToken(accessJti, ttl);
  }

  if (refreshTokenStr) {
    try {
      const decoded = jwt.verify(refreshTokenStr, JWT_SECRET);
      if (decoded.type === "refresh" && decoded.jti) {
        await sessionModel.deactivateSession(decoded.jti);
      }
    } catch {
      // Silently ignore invalid/expired refresh token on logout
    }
  }

  return { message: "Logged out successfully" };
};

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

const forgotPassword = async ({ username }) => {
  const normalizedUsername = normalizeUsername(username);

  const user = await authModel.findUserByUsername(normalizedUsername);
  if (!user) {
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

  const otp = otpService.generateOTP();
  await otpService.storePasswordResetOTP(user.id, userEmail, otp);

  await otpService.sendPasswordResetEmail(userEmail, otp, userName);

  return {
    success: true,
    message: "If an account exists with this username, a reset code has been sent.",
    user_id: user.id,
    masked_email: otpService.maskEmail(userEmail),
  };
};

const resetPassword = async ({ user_id, otp, new_password }) => {
  const verification = await otpService.verifyPasswordResetOTP(user_id, otp);
  if (!verification.success) {
    throw new Error(verification.message);
  }

  if (!new_password || new_password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  await userService.resetPassword(user_id, new_password);

  const user = await authModel.findUserById(user_id);
  if (user?.username) {
    await userCacheService.invalidateUserCache(user.username);
  }

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
  refreshToken,
  logout,
};
