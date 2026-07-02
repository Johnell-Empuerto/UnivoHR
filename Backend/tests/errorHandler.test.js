const errorHandler = require("../middleware/errorHandler");
const ValidationError = require("../utils/ValidationError");

describe("errorHandler", () => {
  let req, res, next;
  let originalEnv;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("returns 400 for ValidationError", () => {
    const err = new ValidationError("Invalid input");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid input" }),
    );
  });

  it("returns 500 for generic Error", () => {
    const err = new Error("Something broke");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Something broke" }),
    );
  });

  it("includes stack trace in development mode", () => {
    process.env.NODE_ENV = "development";
    const err = new Error("dev error");

    errorHandler(err, req, res, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg).toHaveProperty("stack");
    expect(jsonArg.stack).toContain("Error: dev error");
  });

  it("does NOT include stack trace in production mode", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("prod error");

    errorHandler(err, req, res, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg).not.toHaveProperty("stack");
    expect(jsonArg.message).toBe("prod error");
  });

  it("falls back to 'Internal Server Error' when err has no message", () => {
    const err = { status: 500 };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal Server Error" }),
    );
  });

  it("preserves custom status codes from error objects", () => {
    const err = new Error("Custom status");
    err.status = 422;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it("suppresses full stack in production but keeps message", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("sensitive detail");

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith({ correlationId: "none", message: "sensitive detail" });
  });
});
