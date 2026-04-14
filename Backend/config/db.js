const { Pool } = require("pg");
const db = require("./env");

const pool = new Pool({
  user: db.DB_USER,
  host: db.DB_HOST,
  database: db.DB_NAME,
  password: db.DB_PASSWORD,
  port: db.DB_PORT,
});

module.exports = pool;
