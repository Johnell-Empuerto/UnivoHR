const express = require("express");
const router = express.Router();

const controller = require("../controllers/analytics.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const ROLES = require("../constants/roles");
const ADMIN_HR = [ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR];

router.get("/overview", authenticate, authorize(ADMIN_HR), controller.getOverview);
router.get("/anomaly-trend", authenticate, authorize(ADMIN_HR), controller.getAnomalyTrend);
router.get("/forecast-summary", authenticate, authorize(ADMIN_HR), controller.getForecastSummary);
router.get("/department-comparison", authenticate, authorize(ADMIN_HR), controller.getDepartmentComparison);

module.exports = router;
