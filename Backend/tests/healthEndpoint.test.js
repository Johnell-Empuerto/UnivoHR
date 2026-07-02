// Set required env vars before importing the app
process.env.JWT_SECRET = "test-jwt-secret-for-health-endpoint";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "test";

// Mock external dependencies that create persistent connections (Redis, DB pools, Bull queues).
// Without these mocks, importing ../app triggers real Redis/Bull connections that never close,
// causing Jest to hang after all tests finish (the event loop stays active).
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
  ping: jest.fn().mockResolvedValue("PONG"),
}));

jest.mock("../services/queue.service", () => ({
  payslipQueue: { close: jest.fn().mockResolvedValue(undefined) },
  hrFormQueue: { close: jest.fn().mockResolvedValue(undefined) },
  addPayslipToQueue: jest.fn(),
  addBulkPayslipsToQueue: jest.fn(),
  addBulkAssignmentJob: jest.fn(),
}));

jest.mock("../services/deviceProcessing.queue", () => ({
  deviceProcessingQueue: {
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  },
  isReady: jest.fn().mockResolvedValue(false),
}));

jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("00000000-0000-0000-0000-000000000000"),
}));

const request = require("supertest");
const app = require("../app");

describe("GET /api/health", () => {
  it("returns 200 or 503", async () => {
    const res = await request(app).get("/api/health");
    expect([200, 503]).toContain(res.status);
  });

  it("returns JSON content-type", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  it("has status field with valid values", async () => {
    const res = await request(app).get("/api/health");
    expect(["healthy", "degraded", "unhealthy"]).toContain(res.body.status);
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

  it("has all required fields", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body.version).toBeDefined();
    expect(res.body.pid).toBeDefined();
    expect(res.body.nodeVersion).toBeDefined();
    expect(res.body.memory).toBeDefined();
    expect(res.body.memory.rss).toBeDefined();
    expect(res.body.memory.heapTotal).toBeDefined();
    expect(res.body.memory.heapUsed).toBeDefined();
    expect(res.body.database).toBeDefined();
    expect(res.body.redis).toBeDefined();
  });

  it("includes dependency latency", async () => {
    const res = await request(app).get("/api/health");
    expect(typeof res.body.database.latency).toBe("number");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.status).toBe(404);
  });
});
