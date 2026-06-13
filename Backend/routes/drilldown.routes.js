const express = require("express");
const router = express.Router();

const controller = require("../controllers/drilldown.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/attendance",
  authenticate,
  requirePermission("drilldown.view"),
  controller.getAttendance,
);
router.get(
  "/payroll",
  authenticate,
  requirePermission("drilldown.view"),
  controller.getPayroll,
);
router.get(
  "/overtime",
  authenticate,
  requirePermission("drilldown.view"),
  controller.getOvertime,
);
router.get("/leaves", authenticate, requirePermission("drilldown.view"), controller.getLeaves);
router.get(
  "/anomalies",
  authenticate,
  requirePermission("drilldown.view"),
  controller.getAnomalies,
);
router.get(
  "/branches",
  authenticate,
  requirePermission("drilldown.view"),
  controller.getBranches,
);
router.get(
  "/export",
  authenticate,
  requirePermission("drilldown.view"),
  controller.exportDrillDown,
);

module.exports = router;
