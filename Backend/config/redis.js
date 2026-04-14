const { createClient } = require("redis");

const redisClient = createClient({
  url: "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error(" Redis error:", err));

redisClient.on("connect", () => console.log(" Redis connected"));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
