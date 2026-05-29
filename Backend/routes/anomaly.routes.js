const express = require("express");
const router = express.Router();

const controller = require("../controllers/anomaly.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const { ROLES } = require("../constants/roles");

const HR_ACCESS = [ROLES.ADMIN, ROLES.HR_USER];
const ADMIN_ONLY = [ROLES.ADMIN];

router.get("/", authenticate, authorize(HR_ACCESS), controller.getAnomalies);
router.get("/summary", authenticate, authorize(HR_ACCESS), controller.getAnomalySummary);
router.get("/:id", authenticate, authorize(HR_ACCESS), controller.getAnomalyById);
router.patch("/:id/status", authenticate, authorize(HR_ACCESS), controller.updateAnomalyStatus);
router.post("/scan/daily", authenticate, authorize(ADMIN_ONLY), controller.runDailyScan);
router.post("/scan/weekly", authenticate, authorize(ADMIN_ONLY), controller.runWeeklyScan);

module.exports = router;
