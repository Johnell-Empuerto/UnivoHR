const authModel = require("../models/auth.model");
const userModel = require("../models/user.model");
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
const permissionService = require("./permission.service");
const audit = require("./audit.service");
const { validatePassword } = require("../utils/passwordValidator");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m";
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60;
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;
const MAX_ACTIVE_SESSIONS = 5;

const extractReqInfo = (req) => ({
  ip: req?.ip || req?.headers?.["x-forwarded-for"] || "",
  userAgent: req?.headers?.["user-agent"] || "",
});

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
      employment_status: user.employment_status,
      type: "access",
      jti,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
  return { token, jti, expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS };
};

const buildUserResponse = async (user) => {
  const permissions = await permissionService.getEffectivePermissions(user);
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    employee_id: user.employee_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    employment_status: user.employment_status,
    permissions,
  };
};

const enforceMaxSessions = async (userId) => {
  const count = await sessionModel.countActiveSessions(userId);
  if (count >= MAX_ACTIVE_SESSIONS) {
    const oldest = await sessionModel.getOldestActiveSession(userId);
    if (oldest) await sessionModel.deactivateSession(oldest.id);
  }
};

const createSessionAndIssueTokens = async (user, reqInfo) => {
  await enforceMaxSessions(user.id);

  const normalizedUser = {
    ...user,
    role: user.role,
  };

  const access = generateAccessToken(normalizedUser);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000);
  const session = await sessionModel.createSession({
    user_id: normalizedUser.id,
    refresh_token_hash: "pending",
    ip_address: reqInfo?.ip || "",
    user_agent: reqInfo?.userAgent || "",
    expires_at: expiresAt,
  });

  const refreshTokenStr = jwt.sign(
    { id: normalizedUser.id, type: "refresh", jti: session.id },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );

  await sessionModel.updateSessionHash(session.id, hashToken(refreshTokenStr));

  const userResp = await buildUserResponse(normalizedUser);
  return { accessToken: access.token, refreshToken: refreshTokenStr, user: userResp };
};

const login = async ({ username, password }, req) => {
  const normalizedUsername = normalizeUsername(username);
  const reqInfo = extractReqInfo(req);

  const cachedUser = await redisClient.get(`user:${normalizedUsername}`);

  let user;
  if (cachedUser) {
    user = JSON.parse(cachedUser);
  } else {
    user = await authModel.findUserByUsername(normalizedUsername);
  }

  if (user) {
    const isLocked = await loginAttemptService.isAccountLocked(normalizedUsername);
    if (isLocked) {
      audit.auditLog(req, {
        action: "ACCOUNT_LOCKED",
        table_name: "users",
        record_id: user.id,
        new_values: { username },
        description: `Locked account login attempt: ${username}`,
      });
      await addDelay();
      throw new Error("Invalid username or password");
    }
  }

  let isMatch = false;
  if (user) {
    isMatch = await bcrypt.compare(password, user.password_hash);
  }

  if (!user || !isMatch) {
    if (user) {
      const { locked } = await loginAttemptService.trackFailedAttempt(normalizedUsername);
      if (locked && !cachedUser) {
        await userCacheService.cacheUserForLogin(normalizedUsername, user);
      }
      if (locked) {
        audit.auditLog(req, {
          action: "ACCOUNT_LOCKED",
          table_name: "users",
          record_id: user.id,
          new_values: { username },
          description: `Account locked after failed login: ${username}`,
        });
      }
    }
    await addDelay();

    audit.auditLog(req, {
      action: "LOGIN_FAILED",
      table_name: "users",
      record_id: user?.id || null,
      new_values: { username },
      description: `Failed login attempt: ${username}`,
    });

    throw new Error("Invalid username or password");
  }

  if (!cachedUser) {
    await userCacheService.cacheUserForLogin(normalizedUsername, user);
  }

  await loginAttemptService.resetLoginAttempts(normalizedUsername);

  const is2FAEnabled = await settingService.getBoolSetting("enable_2fa_login_email");

  if (is2FAEnabled) {
    const userEmail = user.email;
    if (!userEmail) {
      audit.auditLog(req, {
        action: "LOGIN_PASSWORD_SUCCESS",
        table_name: "users",
        record_id: user.id,
        employee_id: user.employee_id,
        new_values: { username },
        description: `Password correct but 2FA blocked (no email): ${username}`,
      });
      throw new Error("Invalid username or password");
    }

    const otp = otpService.generateOTP();
    await otpService.storeOTP(user.id, userEmail, otp);

    const userName =
      `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;
    await otpService.sendOTPEmail(userEmail, otp, userName);

    audit.auditLog(req, {
      action: "LOGIN_PASSWORD_SUCCESS",
      table_name: "users",
      record_id: user.id,
      employee_id: user.employee_id,
      new_values: { username },
      description: `Password verified, OTP sent: ${username}`,
    });

    audit.auditLog(req, {
      action: "LOGIN_2FA_REQUIRED",
      table_name: "users",
      record_id: user.id,
      employee_id: user.employee_id,
      new_values: { username },
      description: `2FA required: ${username}`,
    });

    return {
      requires_2fa: true,
      user_id: user.id,
      masked_email: otpService.maskEmail(userEmail),
      message: "OTP sent to your email",
    };
  }

  audit.auditLog(req, {
    action: "LOGIN_SUCCESS",
    table_name: "users",
    record_id: user.id,
    employee_id: user.employee_id,
    new_values: { username },
    description: `Successful login: ${username}`,
  });

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

const changePassword = async (userId, { currentPassword, newPassword, confirmPassword }) => {
  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const user = await authModel.findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  const passwordErrors = validatePassword(newPassword, user.username);
  if (passwordErrors.length > 0) {
    throw new Error(passwordErrors[0]);
  }

  const isSame = await bcrypt.compare(newPassword, user.password_hash);
  if (isSame) {
    throw new Error("New password must be different from current password");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  await userModel.updatePassword(userId, hashedPassword);

  userCacheService.invalidateUserCache(user.username);

  return { message: "Password changed successfully" };
};

module.exports = {
  extractReqInfo,
  login,
  verifyOTPAndLogin,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
  logout,
};
