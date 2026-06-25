jest.mock("../config/db", () => ({
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() }),
  end: jest.fn(),
}));
jest.mock("../utils/deviceKey");

const pool = require("../config/db");
const { validateDeviceKey } = require("../utils/deviceKey");
const perDeviceAuth = require("../middleware/perDeviceAuth.middleware");

describe("perDeviceAuth.middleware (development mode)", () => {
  let req, res, next;
  let originalNodeEnv;
  const originalDeviceApiKey = process.env.DEVICE_API_KEY;

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    process.env.DEVICE_API_KEY = "shared-dev-key-123";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.DEVICE_API_KEY = originalDeviceApiKey;
  });

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("allows development fallback with shared DEVICE_API_KEY (no device-id)", async () => {
    req.headers["x-api-key"] = "shared-dev-key-123";

    await perDeviceAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.deviceId).toBeNull();
    expect(req.device).toBeNull();
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("rejects invalid shared DEVICE_API_KEY in development", async () => {
    req.headers["x-api-key"] = "wrong-key";

    await perDeviceAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid device API key",
    });
  });

  it("allows shared key with device-id (looks up device in DB)", async () => {
    req.headers["x-device-id"] = "1";
    req.headers["x-api-key"] = "shared-dev-key-123";
    pool.query.mockResolvedValue({ rows: [{ id: 1, name: "Device 1", status: "ACTIVE" }] });

    await perDeviceAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.deviceId).toBe(1);
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT id, name, status FROM devices WHERE id = $1 AND status = 'ACTIVE'",
      [1],
    );
  });

  it("rejects device not found in DB with shared key", async () => {
    req.headers["x-device-id"] = "999";
    req.headers["x-api-key"] = "shared-dev-key-123";
    pool.query.mockResolvedValue({ rows: [] });

    await perDeviceAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Device not found or inactive",
    });
  });

  it("returns 401 when x-device-id is missing in development", async () => {
    await perDeviceAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when x-api-key is missing with device-id present", async () => {
    req.headers["x-device-id"] = "1";

    await perDeviceAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "x-api-key header is required",
    });
  });
});

describe("perDeviceAuth.middleware (production mode)", () => {
  let req, res, next;
  let originalNodeEnv;

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.DEVICE_API_KEY = "production-key";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("requires x-device-id in production", async () => {
    await perDeviceAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "x-device-id header is required",
    });
  });

  it("requires x-api-key in production", async () => {
    req.headers["x-device-id"] = "1";

    await perDeviceAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "x-api-key header is required",
    });
  });

  it("rejects device not found in production", async () => {
    req.headers["x-device-id"] = "1";
    req.headers["x-api-key"] = "some-key";
    pool.query.mockResolvedValue({ rows: [] });

    await perDeviceAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Device not found",
    });
  });

  it("rejects inactive device in production", async () => {
    req.headers["x-device-id"] = "1";
    req.headers["x-api-key"] = "some-key";
    pool.query.mockResolvedValue({
      rows: [{ id: 1, name: "Dev", status: "INACTIVE", api_key_hash: "hash123" }],
    });

    await perDeviceAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Device is not active",
    });
  });

  it("rejects device with no api_key_hash configured", async () => {
    req.headers["x-device-id"] = "1";
    req.headers["x-api-key"] = "some-key";
    pool.query.mockResolvedValue({
      rows: [{ id: 1, name: "Dev", status: "ACTIVE", api_key_hash: null }],
    });

    await perDeviceAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("no API key"),
    });
  });

  it("rejects invalid device key in production", async () => {
    req.headers["x-device-id"] = "1";
    req.headers["x-api-key"] = "wrong-key";
    pool.query.mockResolvedValue({
      rows: [{ id: 1, name: "Dev", status: "ACTIVE", api_key_hash: "stored-hash" }],
    });
    validateDeviceKey.mockReturnValue(false);

    await perDeviceAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid device API key",
    });
  });

  it("allows valid device key in production", async () => {
    req.headers["x-device-id"] = "1";
    req.headers["x-api-key"] = "valid-dev-key";
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, name: "Dev", status: "ACTIVE", api_key_hash: "stored-hash" }],
      })
      .mockResolvedValueOnce({ rows: [] });
    validateDeviceKey.mockReturnValue(true);

    await perDeviceAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.deviceId).toBe(1);
    expect(req.device).toBeDefined();
  });

  it("handles DB error gracefully", async () => {
    req.headers["x-device-id"] = "1";
    req.headers["x-api-key"] = "some-key";
    pool.query.mockRejectedValue(new Error("DB error"));

    await expect(perDeviceAuth(req, res, next)).rejects.toThrow("DB error");
  });
});
