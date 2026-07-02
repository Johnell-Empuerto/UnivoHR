const { createClient } = require("redis");
const logger = require("../utils/logger");

const redisClient = createClient({
  url: "redis://localhost:6379",
});

redisClient.on("error", (err) => logger.error({ err }, " Redis error:"));

redisClient.on("connect", () => logger.info(" Redis connected"));

// Only auto-connect outside of test environment to prevent open handles during test runs.
// In tests, modules importing config/redis must mock it (e.g. jest.mock("../config/redis", ...)).
if (process.env.NODE_ENV !== "test") {
  (async () => {
    await redisClient.connect();
  })();
}

module.exports = redisClient;
