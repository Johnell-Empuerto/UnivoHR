const jwt = require("jsonwebtoken");
const { isTokenBlacklisted } = require("../services/tokenBlacklist.service");
const logger = require("../utils/logger");

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No or invalid token",
      });
    }

    const token = header.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });

    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({
        message: "Invalid token type",
      });
    }

    if (decoded.jti) {
      const blacklisted = await isTokenBlacklisted(decoded.jti);
      if (blacklisted) {
        return res.status(401).json({
          message: "Token revoked",
        });
      }
    }

    req.user = decoded;

    next();
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "Auth error:");

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
      });
    }

    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

module.exports = authenticate;
