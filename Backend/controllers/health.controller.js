const healthService = require("../services/health.service");

const getHealth = async (req, res, next) => {
  try {
    const result = await healthService.checkHealth();

    const statusCode =
      result.database.status === "connected" &&
      result.redis.status === "connected"
        ? 200
        : 503;

    res.status(statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getHealth };
