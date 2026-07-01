const deviceService = require("../services/device.service");

const receiveLogs = async (req, res, next) => {
  try {
    const result = await deviceService.processLogs(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { receiveLogs };
