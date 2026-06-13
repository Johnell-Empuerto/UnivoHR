const express = require("express");
const router = express.Router();

const controller = require("../controllers/dashboard.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { requireBranchAccessFromQuery } = require("../middleware/branchAccess.middleware");

router.get("/summary", authenticate, requirePermission("dashboard.view"), requireBranchAccessFromQuery(), controller.getSummary);
router.get("/me/summary", authenticate, requirePermission("dashboard.view"), controller.getMySummary);
router.get("/me/today", authenticate, requirePermission("dashboard.view"), controller.getTodayStatus);
router.get("/analytics", authenticate, requirePermission("dashboard.view"), requireBranchAccessFromQuery(), controller.getAdminAnalytics);
router.get("/me/analytics", authenticate, requirePermission("dashboard.view"), controller.getMyAnalytics);
router.get("/kpis", authenticate, requirePermission("dashboard.view"), requireBranchAccessFromQuery(), controller.getExecutiveKpis);

module.exports = router;
