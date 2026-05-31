const express = require("express");
const router = express.Router();

const controller = require("../controllers/anomaly.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/", authenticate, requirePermission("anomalies.view"), controller.getAnomalies);
router.get("/summary", authenticate, requirePermission("anomalies.view"), controller.getAnomalySummary);
router.get("/:id", authenticate, requirePermission("anomalies.view"), controller.getAnomalyById);
router.patch("/:id/status", authenticate, requirePermission("anomalies.view"), controller.updateAnomalyStatus);
router.post("/scan/daily", authenticate, requirePermission("anomalies.scan"), controller.runDailyScan);
router.post("/scan/weekly", authenticate, requirePermission("anomalies.scan"), controller.runWeeklyScan);

module.exports = router;
