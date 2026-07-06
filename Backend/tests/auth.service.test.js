process.env.JWT_SECRET = "test-secret-key";

jest.mock("jsonwebtoken");
jest.mock("bcrypt");
jest.mock("../models/auth.model");
jest.mock("../models/user.model");
jest.mock("../models/session.model");
jest.mock("../services/setting.service");
jest.mock("../services/otp.service");
jest.mock("../services/loginAttempt.service");
jest.mock("../services/user.service");
jest.mock("../config/redis");
jest.mock("../services/tokenBlacklist.service");
jest.mock("../services/permission.service");
jest.mock("../services/audit.service");
jest.mock("../utils/passwordValidator", () => ({ validatePassword: jest.fn() }));
jest.mock("../services/userCache.service", () => ({
  normalizeUsername: jest.fn((u) => u.toLowerCase()),
  cacheUserForLogin: jest.fn().mockResolvedValue(),
  invalidateUserCache: jest.fn().mockResolvedValue(),
}));

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const authModel = require("../models/auth.model");
const userModel = require("../models/user.model");
const sessionModel = require("../models/session.model");
const settingService = require("../services/setting.service");
const otpService = require("../services/otp.service");
const loginAttemptService = require("../services/loginAttempt.service");
const userService = require("../services/user.service");
const userCacheService = require("../services/userCache.service");
const redisClient = require("../config/redis");
const tokenBlacklist = require("../services/tokenBlacklist.service");
const permissionService = require("../services/permission.service");
const audit = require("../services/audit.service");
const { validatePassword } = require("../utils/passwordValidator");

let authService;

const mockUser = {
  id: 1,
  username: "testuser",
  password_hash: "hashed-password",
  role: "employee",
  employee_id: "EMP001",
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  employment_status: "active",
};

const mockReq = {
  ip: "127.0.0.1",
  headers: {
    "x-forwarded-for": "192.168.1.1",
    "user-agent": "test-agent",
  },
};

const mockReqInfo = { ip: "127.0.0.1", userAgent: "test-agent" };

beforeAll(() => {
  jest.spyOn(crypto, "randomUUID").mockReturnValue("mock-uuid");
  jest.spyOn(crypto, "createHash").mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue("mocked-hash"),
  });
  authService = require("../services/auth.service");
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("extractReqInfo", () => {
  it("should extract ip from req.ip (preferred) and userAgent", () => {
    expect(authService.extractReqInfo(mockReq)).toEqual({
      ip: "127.0.0.1",
      userAgent: "test-agent",
    });
  });

  it("should fallback to req.ip when x-forwarded-for is not set", () => {
    const req = { ip: "10.0.0.1", headers: { "user-agent": "agent" } };
    expect(authService.extractReqInfo(req)).toEqual({
      ip: "10.0.0.1",
      userAgent: "agent",
    });
  });

  it("should return empty strings when request has no relevant properties", () => {
    expect(authService.extractReqInfo({})).toEqual({ ip: "", userAgent: "" });
  });

  it("should handle null or undefined request", () => {
    expect(authService.extractReqInfo(null)).toEqual({ ip: "", userAgent: "" });
    expect(authService.extractReqInfo(undefined)).toEqual({ ip: "", userAgent: "" });
  });
});

describe("login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.get.mockResolvedValue(null);
    authModel.findUserByUsername.mockResolvedValue(mockUser);
    loginAttemptService.isAccountLocked.mockResolvedValue(false);
    bcrypt.compare.mockResolvedValue(true);
    loginAttemptService.resetLoginAttempts.mockResolvedValue();
    settingService.getBoolSetting.mockResolvedValue(false);
    loginAttemptService.trackFailedAttempt.mockResolvedValue({ locked: false });
    sessionModel.countActiveSessions.mockResolvedValue(0);
    sessionModel.createSession.mockResolvedValue({ id: "session-id" });
    sessionModel.updateSessionHash.mockResolvedValue();
    permissionService.getEffectivePermissions.mockResolvedValue([]);
    jwt.sign.mockReturnValue("fake-token");
  });

  it("should return tokens on successful login without 2FA", async () => {
    const result = await authService.login(
      { username: "TestUser", password: "password123" },
      mockReq,
    );

    expect(result).toEqual({
      token: "fake-token",
      refreshToken: "fake-token",
      user: {
        id: 1,
        username: "testuser",
        role: "employee",
        employee_id: "EMP001",
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        employment_status: "active",
        permissions: [],
      },
      requires_2fa: false,
    });

    expect(userCacheService.normalizeUsername).toHaveBeenCalledWith("TestUser");
    expect(redisClient.get).toHaveBeenCalledWith("user:testuser");
    expect(authModel.findUserByUsername).toHaveBeenCalledWith("testuser");
    expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed-password");
    expect(userCacheService.cacheUserForLogin).toHaveBeenCalled();
    expect(loginAttemptService.resetLoginAttempts).toHaveBeenCalled();
    expect(sessionModel.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 1 }),
    );
    expect(sessionModel.updateSessionHash).toHaveBeenCalled();
    expect(audit.auditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "LOGIN_SUCCESS" }),
    );
  });

  it("should use cached user when redis has data and attach password hash", async () => {
    redisClient.get.mockResolvedValue(JSON.stringify(mockUser));
    authModel.findPasswordHashByUsername.mockResolvedValue({
      password_hash: "cached-hash",
    });

    const result = await authService.login(
      { username: "testuser", password: "password123" },
      mockReq,
    );

    expect(result).toHaveProperty("token", "fake-token");
    expect(authModel.findUserByUsername).not.toHaveBeenCalled();
    expect(authModel.findPasswordHashByUsername).toHaveBeenCalledWith("testuser");
    expect(bcrypt.compare).toHaveBeenCalledWith("password123", "cached-hash");
    expect(userCacheService.cacheUserForLogin).not.toHaveBeenCalled();
  });

  it("should not cache user again when already loaded from redis", async () => {
    redisClient.get.mockResolvedValue(JSON.stringify(mockUser));
    authModel.findPasswordHashByUsername.mockResolvedValue({
      password_hash: "hashed-password",
    });

    await authService.login(
      { username: "testuser", password: "password123" },
      mockReq,
    );

    expect(userCacheService.cacheUserForLogin).not.toHaveBeenCalled();
  });

  it("should return requires_2fa when setting is enabled", async () => {
    settingService.getBoolSetting.mockResolvedValue(true);
    otpService.generateOTP.mockReturnValue("654321");
    otpService.storeOTP.mockResolvedValue();
    otpService.sendOTPEmail.mockResolvedValue();
    otpService.maskEmail.mockReturnValue("tes***@example.com");

    const result = await authService.login(
      { username: "testuser", password: "password123" },
      mockReq,
    );

    expect(result).toEqual({
      requires_2fa: true,
      user_id: 1,
      masked_email: "tes***@example.com",
      message: "OTP sent to your email",
    });

    expect(otpService.generateOTP).toHaveBeenCalled();
    expect(otpService.storeOTP).toHaveBeenCalledWith(1, "test@example.com", "654321");
    expect(otpService.sendOTPEmail).toHaveBeenCalled();
    expect(otpService.maskEmail).toHaveBeenCalledWith("test@example.com");
    expect(audit.auditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "LOGIN_2FA_REQUIRED" }),
    );
  });

  it("should throw when 2FA is enabled but user has no email", async () => {
    settingService.getBoolSetting.mockResolvedValue(true);
    authModel.findUserByUsername.mockResolvedValue({ ...mockUser, email: null });

    await expect(
      authService.login({ username: "testuser", password: "password123" }, mockReq),
    ).rejects.toThrow("Invalid username or password");

    expect(audit.auditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "LOGIN_PASSWORD_SUCCESS" }),
    );
  });

  it("should throw and track failed attempt on wrong password", async () => {
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login({ username: "testuser", password: "wrong" }, mockReq),
    ).rejects.toThrow("Invalid username or password");

    expect(loginAttemptService.trackFailedAttempt).toHaveBeenCalledWith("testuser");
    expect(audit.auditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "LOGIN_FAILED" }),
    );
  });

  it("should cache user when account becomes locked after failed attempt", async () => {
    bcrypt.compare.mockResolvedValue(false);
    loginAttemptService.trackFailedAttempt.mockResolvedValue({ locked: true });

    await expect(
      authService.login({ username: "testuser", password: "wrong" }, mockReq),
    ).rejects.toThrow("Invalid username or password");

    expect(userCacheService.cacheUserForLogin).toHaveBeenCalledWith("testuser", mockUser);
  });

  it("should throw when account is locked", async () => {
    loginAttemptService.isAccountLocked.mockResolvedValue(true);

    await expect(
      authService.login({ username: "testuser", password: "password123" }, mockReq),
    ).rejects.toThrow("Invalid username or password");

    expect(audit.auditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "ACCOUNT_LOCKED" }),
    );
  });

  it("should throw when user is not found", async () => {
    authModel.findUserByUsername.mockResolvedValue(null);

    await expect(
      authService.login({ username: "unknown", password: "password123" }, mockReq),
    ).rejects.toThrow("Invalid username or password");

    expect(audit.auditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "LOGIN_FAILED" }),
    );
  });
});

describe("verifyOTPAndLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    otpService.verifyOTP.mockResolvedValue({ success: true });
    authModel.findUserById.mockResolvedValue(mockUser);
    sessionModel.countActiveSessions.mockResolvedValue(0);
    sessionModel.createSession.mockResolvedValue({ id: "session-id" });
    sessionModel.updateSessionHash.mockResolvedValue();
    permissionService.getEffectivePermissions.mockResolvedValue([]);
    jwt.sign.mockReturnValue("fake-token");
  });

  it("should return tokens on successful OTP verification", async () => {
    const result = await authService.verifyOTPAndLogin(
      { user_id: 1, otp: "123456" },
      mockReqInfo,
    );

    expect(result).toEqual({
      token: "fake-token",
      refreshToken: "fake-token",
      user: expect.objectContaining({ id: 1 }),
      requires_2fa: false,
    });

    expect(otpService.verifyOTP).toHaveBeenCalledWith(1, "123456");
    expect(authModel.findUserById).toHaveBeenCalledWith(1);
  });

  it("should throw when OTP verification fails", async () => {
    otpService.verifyOTP.mockResolvedValue({ success: false, message: "OTP expired" });

    await expect(
      authService.verifyOTPAndLogin({ user_id: 1, otp: "wrong" }, mockReqInfo),
    ).rejects.toThrow("OTP expired");
  });

  it("should throw when user is not found after OTP verification", async () => {
    authModel.findUserById.mockResolvedValue(null);

    await expect(
      authService.verifyOTPAndLogin({ user_id: 1, otp: "123456" }, mockReqInfo),
    ).rejects.toThrow("User not found");
  });
});

describe("resendOTP", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authModel.findUserById.mockResolvedValue(mockUser);
    otpService.resendOTP.mockResolvedValue({ success: true, message: "OTP resent" });
  });

  it("should resend OTP for existing user", async () => {
    const result = await authService.resendOTP({ user_id: 1 });

    expect(result).toEqual({ success: true, message: "OTP resent" });
    expect(authModel.findUserById).toHaveBeenCalledWith(1);
    expect(otpService.resendOTP).toHaveBeenCalledWith(1, "test@example.com", "Test User");
  });

  it("should throw when user is not found", async () => {
    authModel.findUserById.mockResolvedValue(null);

    await expect(authService.resendOTP({ user_id: 999 })).rejects.toThrow(
      "User not found",
    );
  });

  it("should throw when user has no email", async () => {
    authModel.findUserById.mockResolvedValue({ ...mockUser, email: null });

    await expect(authService.resendOTP({ user_id: 1 })).rejects.toThrow(
      "User email not configured. Please contact HR.",
    );
  });
});

describe("forgotPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authModel.findUserByUsername.mockResolvedValue(mockUser);
    otpService.generateOTP.mockReturnValue("123456");
    otpService.storePasswordResetOTP.mockResolvedValue();
    otpService.sendPasswordResetEmail.mockResolvedValue();
    otpService.maskEmail.mockReturnValue("tes***@example.com");
  });

  it("should generate and send OTP when user has email", async () => {
    const result = await authService.forgotPassword({ username: "TestUser" });

    expect(result).toEqual({
      success: true,
      message: "If an account exists with this username, a reset code has been sent.",
      user_id: 1,
      masked_email: "tes***@example.com",
    });

    expect(userCacheService.normalizeUsername).toHaveBeenCalledWith("TestUser");
    expect(otpService.generateOTP).toHaveBeenCalled();
    expect(otpService.storePasswordResetOTP).toHaveBeenCalledWith(
      1,
      "test@example.com",
      "123456",
    );
    expect(otpService.sendPasswordResetEmail).toHaveBeenCalled();
  });

  it("should return generic message when user is not found", async () => {
    authModel.findUserByUsername.mockResolvedValue(null);

    const result = await authService.forgotPassword({ username: "unknown" });

    expect(result).toEqual({
      success: true,
      message: "If an account exists with this username, a reset code has been sent.",
    });
    expect(otpService.storePasswordResetOTP).not.toHaveBeenCalled();
    expect(otpService.maskEmail).not.toHaveBeenCalled();
  });

  it("should return generic message when user has no email", async () => {
    authModel.findUserByUsername.mockResolvedValue({ ...mockUser, email: null });

    const result = await authService.forgotPassword({ username: "testuser" });

    expect(result).toEqual({
      success: true,
      message: "If an account exists with this username, a reset code has been sent.",
    });
    expect(otpService.storePasswordResetOTP).not.toHaveBeenCalled();
  });
});

describe("resetPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    otpService.verifyPasswordResetOTP.mockResolvedValue({ success: true });
    authModel.findUserById.mockResolvedValue(mockUser);
    validatePassword.mockReturnValue([]);
    userService.resetPassword.mockResolvedValue();
    userCacheService.invalidateUserCache.mockResolvedValue();
    otpService.deletePasswordResetOTP.mockResolvedValue();
  });

  it("should reset password successfully", async () => {
    const result = await authService.resetPassword({
      user_id: 1,
      otp: "123456",
      new_password: "StrongPass1!",
    });

    expect(result).toEqual({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });

    expect(otpService.verifyPasswordResetOTP).toHaveBeenCalledWith(1, "123456");
    expect(authModel.findUserById).toHaveBeenCalledWith(1);
    expect(validatePassword).toHaveBeenCalledWith("StrongPass1!", "testuser");
    expect(userService.resetPassword).toHaveBeenCalledWith(1, "StrongPass1!");
    expect(userCacheService.invalidateUserCache).toHaveBeenCalledWith("testuser");
    expect(otpService.deletePasswordResetOTP).toHaveBeenCalledWith(1);
  });

  it("should throw when OTP verification fails", async () => {
    otpService.verifyPasswordResetOTP.mockResolvedValue({
      success: false,
      message: "Invalid OTP",
    });

    await expect(
      authService.resetPassword({
        user_id: 1,
        otp: "wrong",
        new_password: "StrongPass1!",
      }),
    ).rejects.toThrow("Invalid OTP");
  });

  it("should throw when password validation fails", async () => {
    validatePassword.mockReturnValue(["Password too short"]);

    await expect(
      authService.resetPassword({
        user_id: 1,
        otp: "123456",
        new_password: "short",
      }),
    ).rejects.toThrow("Password too short");
  });

  it("should throw when new_password is empty", async () => {
    await expect(
      authService.resetPassword({
        user_id: 1,
        otp: "123456",
        new_password: "",
      }),
    ).rejects.toThrow("Password is required");
  });
});

describe("changePassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authModel.findUserById.mockResolvedValue(mockUser);
    validatePassword.mockReturnValue([]);
    bcrypt.genSalt.mockResolvedValue("salt");
    bcrypt.hash.mockResolvedValue("new-hashed-password");
    userModel.updatePassword.mockResolvedValue();
  });

  it("should change password successfully", async () => {
    bcrypt.compare
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await authService.changePassword(1, {
      currentPassword: "oldPass",
      newPassword: "NewPass123!",
      confirmPassword: "NewPass123!",
    });

    expect(result).toEqual({ message: "Password changed successfully" });
    expect(authModel.findUserById).toHaveBeenCalledWith(1);
    expect(bcrypt.compare).toHaveBeenNthCalledWith(1, "oldPass", "hashed-password");
    expect(bcrypt.compare).toHaveBeenNthCalledWith(2, "NewPass123!", "hashed-password");
    expect(validatePassword).toHaveBeenCalledWith("NewPass123!", "testuser");
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith("NewPass123!", "salt");
    expect(userModel.updatePassword).toHaveBeenCalledWith(1, "new-hashed-password");
    expect(userCacheService.invalidateUserCache).toHaveBeenCalledWith("testuser");
  });

  it("should throw when passwords do not match", async () => {
    await expect(
      authService.changePassword(1, {
        currentPassword: "oldPass",
        newPassword: "Pass1",
        confirmPassword: "Pass2",
      }),
    ).rejects.toThrow("Passwords do not match");
  });

  it("should throw when current password is incorrect", async () => {
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.changePassword(1, {
        currentPassword: "wrong",
        newPassword: "NewPass123!",
        confirmPassword: "NewPass123!",
      }),
    ).rejects.toThrow("Current password is incorrect");
  });

  it("should throw when new password is same as current", async () => {
    bcrypt.compare
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    await expect(
      authService.changePassword(1, {
        currentPassword: "samePass",
        newPassword: "samePass",
        confirmPassword: "samePass",
      }),
    ).rejects.toThrow("New password must be different from current password");
  });

  it("should throw when user is not found", async () => {
    authModel.findUserById.mockResolvedValue(null);

    await expect(
      authService.changePassword(999, {
        currentPassword: "oldPass",
        newPassword: "NewPass123!",
        confirmPassword: "NewPass123!",
      }),
    ).rejects.toThrow("User not found");
  });
});

describe("refreshToken", () => {
  const baseSession = {
    id: "session-id",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    refresh_token_hash: "mocked-hash",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({
      id: 1,
      type: "refresh",
      jti: "session-id",
    });
    sessionModel.findActiveSession.mockResolvedValue({ ...baseSession });
    sessionModel.deactivateSession.mockResolvedValue();
    authModel.findUserById.mockResolvedValue(mockUser);
    sessionModel.countActiveSessions.mockResolvedValue(0);
    sessionModel.createSession.mockResolvedValue({ id: "new-session-id" });
    sessionModel.updateSessionHash.mockResolvedValue();
    permissionService.getEffectivePermissions.mockResolvedValue([]);
    jwt.sign.mockReturnValue("new-fake-token");
  });

  it("should return new tokens on successful refresh", async () => {
    const result = await authService.refreshToken("valid-refresh-token", mockReqInfo);

    expect(result).toEqual({
      token: "new-fake-token",
      refreshToken: "new-fake-token",
    });

    expect(jwt.verify).toHaveBeenCalledWith("valid-refresh-token", "test-secret-key", {
      algorithms: ["HS256"],
    });
    expect(sessionModel.findActiveSession).toHaveBeenCalledWith("session-id", 1);
    expect(sessionModel.deactivateSession).toHaveBeenCalledWith("session-id");
    expect(sessionModel.createSession).toHaveBeenCalled();
  });

  it("should throw when no token is provided", async () => {
    await expect(
      authService.refreshToken(null, mockReqInfo),
    ).rejects.toThrow("Refresh token is required");

    await expect(
      authService.refreshToken(undefined, mockReqInfo),
    ).rejects.toThrow("Refresh token is required");

    await expect(
      authService.refreshToken("", mockReqInfo),
    ).rejects.toThrow("Refresh token is required");
  });

  it("should throw for invalid token type", async () => {
    jwt.verify.mockReturnValue({ id: 1, type: "access", jti: "session-id" });

    await expect(
      authService.refreshToken("access-token", mockReqInfo),
    ).rejects.toThrow("Invalid token type");
  });

  it("should throw when session is not found", async () => {
    sessionModel.findActiveSession.mockResolvedValue(null);

    await expect(
      authService.refreshToken("valid-refresh-token", mockReqInfo),
    ).rejects.toThrow("Session not found or already revoked");
  });

  it("should throw when session is expired", async () => {
    sessionModel.findActiveSession.mockResolvedValue({
      ...baseSession,
      expires_at: new Date(Date.now() - 86400000).toISOString(),
    });

    await expect(
      authService.refreshToken("valid-refresh-token", mockReqInfo),
    ).rejects.toThrow("Session expired, please login again");

    expect(sessionModel.deactivateSession).toHaveBeenCalledWith("session-id");
  });

  it("should throw when token hash does not match", async () => {
    sessionModel.findActiveSession.mockResolvedValue({
      ...baseSession,
      refresh_token_hash: "different-hash",
    });

    await expect(
      authService.refreshToken("valid-refresh-token", mockReqInfo),
    ).rejects.toThrow("Refresh token has been revoked");

    expect(sessionModel.deactivateSession).toHaveBeenCalledWith("session-id");
  });

  it("should throw specific message for expired refresh token", async () => {
    const err = new Error("jwt expired");
    err.name = "TokenExpiredError";
    jwt.verify.mockImplementation(() => {
      throw err;
    });

    await expect(
      authService.refreshToken("expired-token", mockReqInfo),
    ).rejects.toThrow("Refresh token expired, please login again");
  });

  it("should throw for other JWT verification errors", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    await expect(
      authService.refreshToken("malformed-token", mockReqInfo),
    ).rejects.toThrow("Invalid refresh token");
  });
});

describe("logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should blacklist access token and deactivate session", async () => {
    const now = Math.floor(Date.now() / 1000);
    jwt.verify.mockReturnValue({ type: "refresh", jti: "session-id" });

    const result = await authService.logout("access-jti", now + 3600, "refresh-token");

    expect(result).toEqual({ message: "Logged out successfully" });
    expect(tokenBlacklist.blacklistToken).toHaveBeenCalledWith(
      "access-jti",
      expect.any(Number),
    );
    expect(jwt.verify).toHaveBeenCalledWith("refresh-token", "test-secret-key", {
      algorithms: ["HS256"],
    });
    expect(sessionModel.deactivateSession).toHaveBeenCalledWith("session-id");
  });

  it("should not blacklist when accessJti or accessExp is missing", async () => {
    await authService.logout(null, null, "refresh-token");
    expect(tokenBlacklist.blacklistToken).not.toHaveBeenCalled();
  });

  it("should skip session deactivation when no refresh token is provided", async () => {
    await authService.logout("access-jti", 9999999999, null);
    expect(sessionModel.deactivateSession).not.toHaveBeenCalled();
  });

  it("should handle JWT verify error during logout gracefully", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const result = await authService.logout("access-jti", 9999999999, "bad-token");

    expect(result).toEqual({ message: "Logged out successfully" });
    expect(sessionModel.deactivateSession).not.toHaveBeenCalled();
  });
});
