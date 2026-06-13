const { Pool } = require("pg");
const db = require("./env");

const poolConfig = {
  user: db.DB_USER,
  host: db.DB_HOST,
  database: db.DB_NAME,
  password: db.DB_PASSWORD,
  port: db.DB_PORT,
};

// Enable SSL in production for secure database connections
if (db.NODE_ENV === "production") {
  poolConfig.ssl = {
    rejectUnauthorized: true,
  };
}

const pool = new Pool(poolConfig);

module.exports = pool;
