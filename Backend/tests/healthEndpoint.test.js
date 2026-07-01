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
