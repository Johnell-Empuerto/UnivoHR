const pinoHttp = require("pino-http");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.correlationId || uuidv4(),
  autoLogging: {
    ignore: (req) => req.url === "/api/health",
  },
  customReceivedMessage: (req) => `--> ${req.method} ${req.url}`,
  customSuccessMessage: (req, res) =>
    `<-- ${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `<-- ${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
});

module.exports = (req, res, next) => {
  req.correlationId = req.correlationId || uuidv4();
  httpLogger(req, res, next);
};
