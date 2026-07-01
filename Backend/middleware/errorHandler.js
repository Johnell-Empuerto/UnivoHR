const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  const correlationId = req.correlationId || "none";

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;

  if (err.name === "ValidationError") {
    statusCode = 400;
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  } else if (err.name === "SyntaxError" && err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON payload";
  } else if (err.code === "23505") {
    statusCode = 409;
    message = "Duplicate entry";
  } else if (err.code === "23503") {
    statusCode = 409;
    message = "Referenced resource not found";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request entity too large";
  }

  logger.error(
    { err, correlationId, statusCode, url: req.originalUrl, method: req.method },
    message,
  );

  const body = { message };
  if (details) body.details = details;
  body.correlationId = correlationId;

  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) body.stack = err.stack;

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
