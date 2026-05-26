const express = require("express");
const router = express.Router();

const controller = require("../controllers/anomaly.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const ROLES = require("../constants/roles");

const ADMIN_HR = [ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR];

router.get(
  "/",
  authenticate,
  authorize(ADMIN_HR),
  controller.getAnomalies,
);

router.get(
  "/summary",
  authenticate,
  authorize(ADMIN_HR),
  controller.getAnomalySummary,
);

router.get(
  "/:id",
  authenticate,
  authorize(ADMIN_HR),
  controller.getAnomalyById,
);

router.patch(
  "/:id/status",
  authenticate,
  authorize(ADMIN_HR),
  controller.updateAnomalyStatus,
);

router.post(
  "/scan/daily",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.runDailyScan,
);

router.post(
  "/scan/weekly",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.runWeeklyScan,
);

module.exports = router;
