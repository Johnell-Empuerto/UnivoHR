const express = require("express");
const router = express.Router();

const controller = require("../controllers/dashboard.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const ROLES = require("../constants/roles");

// Admin / HR Admin dashboard (company-wide)
router.get(
  "/summary",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getSummary,
);

//  Employee / all users (personal dashboard)
router.get(
  "/me/summary",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getMySummary,
);

router.get(
  "/me/today",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getTodayStatus,
);

// Analytics (sensitive)
router.get(
  "/analytics",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getAdminAnalytics,
);

router.get(
  "/me/analytics",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getMyAnalytics,
);

module.exports = router;
