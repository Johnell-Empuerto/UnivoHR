const { Pool } = require("pg");
const db = require("./env");

const poolConfig = {
  user: db.DB_USER,
  host: db.DB_HOST,
  database: db.DB_NAME,
  password: db.DB_PASSWORD,
  port: db.DB_PORT,
  max: parseInt(process.env.DB_POOL_MAX, 10) || 25,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS, 10) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS, 10) || 10000,
};

// Enable SSL in production for secure database connections
if (db.NODE_ENV === "production") {
  poolConfig.ssl = {
    rejectUnauthorized: true,
  };
}

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

module.exports = pool;
