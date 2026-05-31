const express = require("express");
const router = express.Router();
const controller = require("../controllers/payroll.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

// Queue status (admin only)
router.get(
  "/status",
  authenticate,
  requirePermission("settings.system"),
  controller.getQueueStatus,
);

module.exports = router;
