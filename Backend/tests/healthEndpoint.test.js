const express = require("express");
const request = require("supertest");

function createHealthApp() {
  const app = express();
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "development",
    });
  });
  return app;
}

describe("GET /api/health", () => {
  const app = createHealthApp();

  it("returns 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });

  it("returns JSON content-type", async () => {
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

  it("returns 404 for unknown routes on the same app", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.status).toBe(404);
  });

  it("has exactly the expected 4 fields", async () => {
    const res = await request(app).get("/api/health");
    expect(Object.keys(res.body).sort()).toEqual(
      ["status", "timestamp", "uptime", "environment"].sort(),
    );
  });
});
