const express = require("express");
const request = require("supertest");

function createRootApp() {
  const app = express();
  app.get("/", (req, res) => {
    res.json({
      message: "Welcome to Payroll and Attendance System",
      version: "1.0.0",
    });
  });
  return app;
}

describe("GET /", () => {
  const app = createRootApp();

  it("returns 200", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
  });

  it("returns JSON content-type", async () => {
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
