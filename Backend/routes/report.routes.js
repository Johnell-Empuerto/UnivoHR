const express = require("express");
const router = express.Router();

const controller = require("../controllers/report.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const ROLES = require("../constants/roles");
const ADMIN_HR = [ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR];

router.get("/employees", authenticate, authorize(ADMIN_HR), controller.getEmployeeReport);
router.get("/leaves", authenticate, authorize(ADMIN_HR), controller.getLeaveReport);
router.get("/attendance", authenticate, authorize(ADMIN_HR), controller.getAttendanceReport);
router.get("/payroll", authenticate, authorize(ADMIN_HR), controller.getPayrollReport);
router.get("/benefits", authenticate, authorize(ADMIN_HR), controller.getBenefitsReport);
router.get("/performance", authenticate, authorize(ADMIN_HR), controller.getPerformanceReport);
router.get("/export", authenticate, authorize(ADMIN_HR), controller.exportReport);

module.exports = router;
