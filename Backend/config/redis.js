const { createClient } = require("redis");
const logger = require("../utils/logger");

const redisClient = createClient({
  url: "redis://localhost:6379",
});

redisClient.on("error", (err) => logger.error({ err }, " Redis error:"));

redisClient.on("connect", () => logger.info(" Redis connected"));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
