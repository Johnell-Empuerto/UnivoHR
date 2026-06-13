const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const requiredEnv = [
  "JWT_SECRET",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const NODE_ENV = process.env.NODE_ENV || "development";

// In production, require DEVICE_API_KEY
if (NODE_ENV === "production" && !process.env.DEVICE_API_KEY) {
  console.error("[SECURITY] FATAL: DEVICE_API_KEY must be set in production");
  process.exit(1);
}

module.exports = {
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV,
};
