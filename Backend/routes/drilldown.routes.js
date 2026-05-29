const express = require("express");
const router = express.Router();

const controller = require("../controllers/drilldown.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const ROLES = require("../constants/roles");
const ADMIN_HR = [ROLES.ADMIN, ROLES.HR_USER];

router.get("/attendance", authenticate, authorize(ADMIN_HR), controller.getAttendance);
router.get("/payroll", authenticate, authorize(ADMIN_HR), controller.getPayroll);
router.get("/overtime", authenticate, authorize(ADMIN_HR), controller.getOvertime);
router.get("/leaves", authenticate, authorize(ADMIN_HR), controller.getLeaves);
router.get("/anomalies", authenticate, authorize(ADMIN_HR), controller.getAnomalies);
router.get("/branches", authenticate, authorize(ADMIN_HR), controller.getBranches);
router.get("/export", authenticate, authorize(ADMIN_HR), controller.exportDrillDown);

module.exports = router;
