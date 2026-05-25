const express = require("express");
const router = express.Router();
const controller = require("../controllers/device.controller");
const deviceAuth = require("../middleware/deviceAuth.middleware");

router.post("/logs", deviceAuth, controller.receiveLogs);

module.exports = router;
