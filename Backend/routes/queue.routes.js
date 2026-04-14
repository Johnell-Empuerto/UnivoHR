const express = require("express");
const router = express.Router();
const controller = require("../controllers/payroll.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// Queue status (admin only)
router.get(
  "/status",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getQueueStatus,
);

module.exports = router;
