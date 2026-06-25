jest.mock("../services/auth.service", () => ({
  login: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  refreshToken: jest.fn(),
  extractReqInfo: jest.fn(),
}));

jest.mock("../services/audit.service", () => ({
  auditLog: jest.fn(),
  fetchOldValues: jest.fn(),
  log: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const controller = require("../controllers/auth.controller");
const authService = require("../services/auth.service");

function createAuthApp() {
  const app = express();
  app.use(express.json());
  app.post("/api/auth/login", controller.login);
  app.post("/api/auth/forgot-password", controller.forgotPassword);
  app.post("/api/auth/reset-password", controller.resetPassword);
  app.post("/api/auth/refresh", controller.refresh);
  return app;
}

describe("POST /api/auth/login — error path", () => {
  const app = createAuthApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when authService.login throws", async () => {
    authService.login.mockRejectedValue(new Error("Invalid username or password"));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Invalid username or password" });
  });

  it("passes req.body and req to authService.login", async () => {
    authService.login.mockRejectedValue(new Error("any error"));

    await request(app)
      .post("/api/auth/login")
      .send({ username: "testuser", password: "testpass" });

    expect(authService.login).toHaveBeenCalledTimes(1);
    const [bodyArg, reqArg] = authService.login.mock.calls[0];
    expect(bodyArg).toEqual({ username: "testuser", password: "testpass" });
    expect(reqArg).toMatchObject({
      method: "POST",
      url: "/api/auth/login",
    });
  });

  it("returns 401 as JSON with message for any service error", async () => {
    authService.login.mockRejectedValue(new Error("DB connection failed"));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "x", password: "y" });

    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("message");
  });

  it("passes empty body through to service", async () => {
    authService.login.mockRejectedValue(new Error("any"));

    await request(app).post("/api/auth/login").send({});

    expect(authService.login).toHaveBeenCalledWith({}, expect.anything());
  });
});

describe("POST /api/auth/forgot-password — validation", () => {
  const app = createAuthApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when username is missing", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Username is required" });
  });

  it("returns 400 when username is empty string", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ username: "" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Username is required" });
  });

  it("returns 400 when username is only whitespace", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ username: "   " });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Username is required" });
  });

  it("calls authService.forgotPassword with valid username", async () => {
    authService.forgotPassword.mockResolvedValue({
      success: true,
      message: "If an account exists with this username, a reset code has been sent.",
    });

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ username: "existinguser" });

    expect(authService.forgotPassword).toHaveBeenCalledWith({
      username: "existinguser",
    });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/auth/reset-password — validation", () => {
  const app = createAuthApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when user_id is missing", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ otp: "123456", new_password: "NewPass1!" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "User ID, OTP, and new password are required",
    });
  });

  it("returns 400 when otp is missing", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ user_id: 1, new_password: "NewPass1!" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when new_password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ user_id: 1, otp: "123456" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when all fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({});

    expect(res.status).toBe(400);
  });

  it("calls authService.resetPassword when all fields present", async () => {
    authService.resetPassword.mockResolvedValue({
      success: true,
      message: "Password reset successfully",
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ user_id: 1, otp: "123456", new_password: "NewPass1!" });

    expect(authService.resetPassword).toHaveBeenCalledWith({
      user_id: 1,
      otp: "123456",
      new_password: "NewPass1!",
    });
    expect(res.status).toBe(200);
  });

  it("handles service error for reset-password with 400", async () => {
    authService.resetPassword.mockRejectedValue(
      new Error("OTP has expired"),
    );

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ user_id: 1, otp: "000000", new_password: "NewPass1!" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "OTP has expired" });
  });
});

describe("POST /api/auth/refresh — validation", () => {
  const app = createAuthApp();

  beforeEach(() => {
    jest.clearAllMocks();
    authService.extractReqInfo.mockReturnValue({
      ip: "127.0.0.1",
      userAgent: "supertest",
    });
  });

  it("returns 400 when refreshToken is missing", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Refresh token is required" });
  });

  it("calls authService.refreshToken with token and reqInfo", async () => {
    authService.refreshToken.mockResolvedValue({
      token: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "valid-refresh-token" });

    expect(authService.refreshToken).toHaveBeenCalledWith(
      "valid-refresh-token",
      expect.anything(),
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("refreshToken");
  });

  it("handles service error with 401", async () => {
    authService.refreshToken.mockRejectedValue(
      new Error("Refresh token expired, please login again"),
    );

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "expired-token" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      message: "Refresh token expired, please login again",
    });
  });
});
