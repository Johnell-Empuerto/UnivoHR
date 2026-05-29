const express = require("express");
const router = express.Router();

const controller = require("../controllers/dashboard.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const { ROLES } = require("../constants/roles");

const HR_ACCESS = [ROLES.ADMIN];
const ALL = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER, ROLES.EMPLOYEE];

router.get("/summary", authenticate, authorize(HR_ACCESS), controller.getSummary);
router.get("/me/summary", authenticate, authorize(ALL), controller.getMySummary);
router.get("/me/today", authenticate, authorize(ALL), controller.getTodayStatus);
router.get("/analytics", authenticate, authorize(HR_ACCESS), controller.getAdminAnalytics);
router.get("/me/analytics", authenticate, authorize(ALL), controller.getMyAnalytics);
router.get("/kpis", authenticate, authorize(HR_ACCESS), controller.getExecutiveKpis);

module.exports = router;
