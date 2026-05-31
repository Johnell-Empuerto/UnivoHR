const express = require("express");
const router = express.Router();

const controller = require("../controllers/statisticalAnomaly.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.post("/scan/daily", authenticate, requirePermission("anomalies.view"), controller.runDailyScan);
router.post("/scan/weekly", authenticate, requirePermission("anomalies.view"), controller.runWeeklyScan);

module.exports = router;
