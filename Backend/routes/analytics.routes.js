const express = require("express");
const router = express.Router();

const controller = require("../controllers/analytics.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const { ROLES } = require("../constants/roles");
const HR_ACCESS = [ROLES.ADMIN, ROLES.HR_USER];

router.get("/overview", authenticate, authorize(HR_ACCESS), controller.getOverview);
router.get("/anomaly-trend", authenticate, authorize(HR_ACCESS), controller.getAnomalyTrend);
router.get("/forecast-summary", authenticate, authorize(HR_ACCESS), controller.getForecastSummary);
router.get("/department-comparison", authenticate, authorize(HR_ACCESS), controller.getDepartmentComparison);

module.exports = router;
