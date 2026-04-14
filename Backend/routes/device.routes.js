const express = require("express");
const router = express.Router();
const controller = require("../controllers/device.controller");

router.post("/logs", controller.receiveLogs);

module.exports = router;
