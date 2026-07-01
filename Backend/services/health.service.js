const pool = require("../config/db");
const redisClient = require("../config/redis");
const { version } = require("../package.json");

const formatBytes = (bytes) => {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
};

const checkDatabase = async () => {
  const start = Date.now();
  try {
    await pool.query("SELECT 1");
    return {
      status: "connected",
      latency: Date.now() - start,
    };
  } catch {
    return {
      status: "error",
      latency: Date.now() - start,
    };
  }
};

const checkRedis = async () => {
  const start = Date.now();
  try {
    await redisClient.ping();
    return {
      status: "connected",
      latency: Date.now() - start,
    };
  } catch {
    return {
      status: "error",
      latency: Date.now() - start,
    };
  }
};

const checkHealth = async () => {
  const [database, redis] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  const pgHealthy = database.status === "connected";
  const redisHealthy = redis.status === "connected";

  let overall;
  if (pgHealthy && redisHealthy) {
    overall = "healthy";
  } else if (pgHealthy && !redisHealthy) {
    overall = "degraded";
  } else {
    overall = "unhealthy";
  }

  const mem = process.memoryUsage();

  return {
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version,
    nodeVersion: process.version,
    pid: process.pid,
    memory: {
      rss: formatBytes(mem.rss),
      heapUsed: formatBytes(mem.heapUsed),
      heapTotal: formatBytes(mem.heapTotal),
    },
    database,
    redis,
  };
};

module.exports = { checkHealth };
