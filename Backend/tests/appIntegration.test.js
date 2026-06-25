process.env.JWT_SECRET = "test-jwt-secret-for-app-integration";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "test";

jest.mock("../config/db", () => ({
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn(),
  }),
  end: jest.fn(),
}));

jest.mock("../config/redis", () => ({
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  quit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../services/queue.service", () => ({
  payslipQueue: { close: jest.fn().mockResolvedValue(undefined) },
  hrFormQueue: { close: jest.fn().mockResolvedValue(undefined) },
  addPayslipToQueue: jest.fn(),
  addBulkPayslipsToQueue: jest.fn(),
  addBulkAssignmentJob: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("00000000-0000-0000-0000-000000000000"),
}));

jest.mock("../services/deviceProcessing.queue", () => ({
  deviceProcessingQueue: {
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  },
  isReady: jest.fn().mockResolvedValue(false),
}));

const request = require("supertest");
const app = require("../app");

describe("GET /api/health (public)", () => {
  it("returns 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });

  it("returns JSON", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  it("has status field set to 'ok'", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body.status).toBe("ok");
  });

  it("has timestamp field as ISO string", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body.timestamp).toBeDefined();
    expect(typeof res.body.timestamp).toBe("string");
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it("has uptime field as a non-negative integer", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body.uptime).toBeDefined();
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(res.body.uptime)).toBe(true);
  });

  it("has environment field", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body.environment).toBeDefined();
    expect(typeof res.body.environment).toBe("string");
    expect(res.body.environment.length).toBeGreaterThan(0);
  });

  it("has exactly the expected 4 fields", async () => {
    const res = await request(app).get("/api/health");
    expect(Object.keys(res.body).sort()).toEqual(
      ["status", "timestamp", "uptime", "environment"].sort(),
    );
  });
});

describe("GET / (public root)", () => {
  it("returns 200", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
  });

  it("returns JSON", async () => {
    const res = await request(app).get("/");
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  it("has message field", async () => {
    const res = await request(app).get("/");
    expect(res.body.message).toBe("Welcome to Payroll and Attendance System");
  });

  it("has version field", async () => {
    const res = await request(app).get("/");
    expect(res.body.version).toBe("1.0.0");
  });

  it("has exactly the expected 2 fields", async () => {
    const res = await request(app).get("/");
    expect(Object.keys(res.body).sort()).toEqual(["message", "version"]);
  });
});

describe("GET /api/does-not-exist (404)", () => {
  it("returns 404", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("returns JSON with message 'Route not found'", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.message).toBe("Route not found");
  });
});

describe("GET /api/employees (protected, no token)", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app).get("/api/employees");
    expect(res.status).toBe(401);
  });

  it("returns JSON with message 'No or invalid token'", async () => {
    const res = await request(app).get("/api/employees");
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.message).toBe("No or invalid token");
  });
});
