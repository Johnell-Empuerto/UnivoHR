jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../config/redis", () => ({ ping: jest.fn() }));
jest.mock("../package.json", () => ({ version: "1.0.0-test" }));

const pool = require("../config/db");
const redisClient = require("../config/redis");
const { checkHealth } = require("../services/health.service");

describe("health.service checkHealth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns healthy when both DB and Redis are connected", async () => {
    pool.query.mockResolvedValue({});
    redisClient.ping.mockResolvedValue("PONG");

    const result = await checkHealth();

    expect(result.status).toBe("healthy");
    expect(result.database.status).toBe("connected");
    expect(result.redis.status).toBe("connected");
    expect(result.version).toBe("1.0.0-test");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("uptime");
    expect(result).toHaveProperty("memory");
  });

  it("returns degraded when DB is connected but Redis is down", async () => {
    pool.query.mockResolvedValue({});
    redisClient.ping.mockRejectedValue(new Error("Redis down"));

    const result = await checkHealth();

    expect(result.status).toBe("degraded");
    expect(result.database.status).toBe("connected");
    expect(result.redis.status).toBe("error");
  });

  it("returns unhealthy when DB is down", async () => {
    pool.query.mockRejectedValue(new Error("DB down"));
    redisClient.ping.mockResolvedValue("PONG");

    const result = await checkHealth();

    expect(result.status).toBe("unhealthy");
    expect(result.database.status).toBe("error");
  });

  it("returns unhealthy when both are down", async () => {
    pool.query.mockRejectedValue(new Error("DB down"));
    redisClient.ping.mockRejectedValue(new Error("Redis down"));

    const result = await checkHealth();

    expect(result.status).toBe("unhealthy");
  });

  it("reports latency numbers", async () => {
    pool.query.mockResolvedValue({});
    redisClient.ping.mockResolvedValue("PONG");

    const result = await checkHealth();

    expect(typeof result.database.latency).toBe("number");
    expect(typeof result.redis.latency).toBe("number");
  });
});
