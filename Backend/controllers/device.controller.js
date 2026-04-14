const deviceService = require("../services/device.service");

const receiveLogs = async (req, res) => {
  try {
    const result = await deviceService.processLogs(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { receiveLogs };
