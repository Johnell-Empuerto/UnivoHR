const express = require("express");
const router = express.Router();
const controller = require("../controllers/device.controller");
const perDeviceAuth = require("../middleware/perDeviceAuth.middleware");
const { deviceLogLimiter } = require("../middleware/rateLimit.middleware");

router.post("/logs", perDeviceAuth, deviceLogLimiter, controller.receiveLogs);

module.exports = router;
