jest.mock("jsonwebtoken");
jest.mock("../services/tokenBlacklist.service", () => ({
  isTokenBlacklisted: jest.fn(),
  blacklistToken: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const { isTokenBlacklisted } = require("../services/tokenBlacklist.service");
const authenticate = require("../middleware/auth.middleware");

describe("auth.middleware authenticate()", () => {
  let req, res, next;

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-key-for-unit-tests";
  });

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("returns 401 when Authorization header is missing", async () => {
    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "No or invalid token",
    });
  });

  it("returns 401 when header does not start with Bearer", async () => {
    req.headers.authorization = "Basic somecredentials";

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "No or invalid token",
    });
  });

  it("returns 401 for invalid Bearer format (no token)", async () => {
    req.headers.authorization = "Bearer ";

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("attaches decoded user to req.user and calls next() for valid token", async () => {
    req.headers.authorization = "Bearer valid.jwt.token";
    const decodedPayload = { id: 1, role: "ADMIN", jti: "token-uuid" };
    jwt.verify.mockReturnValue(decodedPayload);
    isTokenBlacklisted.mockResolvedValue(false);

    await authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "valid.jwt.token",
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] },
    );
    expect(isTokenBlacklisted).toHaveBeenCalledWith("token-uuid");
    expect(req.user).toEqual(decodedPayload);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when token is expired", async () => {
    req.headers.authorization = "Bearer expired.jwt.token";
    const tokenError = new Error("jwt expired");
    tokenError.name = "TokenExpiredError";
    jwt.verify.mockImplementation(() => { throw tokenError; });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token expired",
    });
  });

  it("returns 401 when token is malformed (JsonWebTokenError)", async () => {
    req.headers.authorization = "Bearer bad.jwt.token";
    const tokenError = new Error("invalid token");
    tokenError.name = "JsonWebTokenError";
    jwt.verify.mockImplementation(() => { throw tokenError; });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid token",
    });
  });

  it("returns 401 when token is blacklisted", async () => {
    req.headers.authorization = "Bearer revoked.jwt.token";
    jwt.verify.mockReturnValue({ id: 1, role: "EMPLOYEE", jti: "revoked-jti" });
    isTokenBlacklisted.mockResolvedValue(true);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token revoked",
    });
  });

  it("calls next() without jti in payload", async () => {
    req.headers.authorization = "Bearer no.jti.token";
    jwt.verify.mockReturnValue({ id: 1, role: "EMPLOYEE" });

    await authenticate(req, res, next);

    expect(isTokenBlacklisted).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when decoded token type is not 'access'", async () => {
    req.headers.authorization = "Bearer refresh.jwt.token";
    jwt.verify.mockReturnValue({ id: 1, type: "refresh", jti: "refresh-uuid" });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid token type",
    });
  });

  it("returns 401 on unexpected auth errors", async () => {
    req.headers.authorization = "Bearer some.jwt.token";
    jwt.verify.mockImplementation(() => { throw new Error("Unexpected"); });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
