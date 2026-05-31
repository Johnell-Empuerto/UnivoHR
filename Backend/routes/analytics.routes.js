const express = require("express");
const router = express.Router();

const controller = require("../controllers/analytics.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/overview", authenticate, requirePermission("analytics.view"), controller.getOverview);
router.get("/anomaly-trend", authenticate, requirePermission("analytics.view"), controller.getAnomalyTrend);
router.get("/forecast-summary", authenticate, requirePermission("analytics.view"), controller.getForecastSummary);
router.get("/department-comparison", authenticate, requirePermission("analytics.view"), controller.getDepartmentComparison);

module.exports = router;
