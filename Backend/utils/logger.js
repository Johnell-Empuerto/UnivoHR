const pino = require("pino");
const { v4: uuidv4 } = require("uuid");

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino/file",
          options: { destination: 1 },
        },
      }),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "body.password",
      "body.token",
      "body.secret",
      "body.api_key",
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      correlationId: req.correlationId,
      headers: {
        "user-agent": req.headers?.["user-agent"],
        "content-type": req.headers?.["content-type"],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

module.exports = logger;
