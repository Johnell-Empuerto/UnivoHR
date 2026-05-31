const express = require("express");
const router = express.Router();

const controller = require("../controllers/drilldown.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/attendance",
  authenticate,
  requirePermission("analytics.view"),
  controller.getAttendance,
);
router.get(
  "/payroll",
  authenticate,
  requirePermission("analytics.view"),
  controller.getPayroll,
);
router.get(
  "/overtime",
  authenticate,
  requirePermission("analytics.view"),
  controller.getOvertime,
);
router.get("/leaves", authenticate, requirePermission("analytics.view"), controller.getLeaves);
router.get(
  "/anomalies",
  authenticate,
  requirePermission("analytics.view"),
  controller.getAnomalies,
);
router.get(
  "/branches",
  authenticate,
  requirePermission("analytics.view"),
  controller.getBranches,
);
router.get(
  "/export",
  authenticate,
  requirePermission("analytics.view"),
  controller.exportDrillDown,
);

module.exports = router;
