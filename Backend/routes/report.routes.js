const express = require("express");
const router = express.Router();

const controller = require("../controllers/report.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const { ROLES } = require("../constants/roles");
const HR_ACCESS = [ROLES.ADMIN, ROLES.HR_USER];
const PAYROLL_ADMIN = [ROLES.ADMIN, ROLES.PAYROLL_USER];
const ALL_REPORTS = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER];

router.get("/employees", authenticate, authorize(HR_ACCESS), controller.getEmployeeReport);
router.get("/leaves", authenticate, authorize(HR_ACCESS), controller.getLeaveReport);
router.get("/attendance", authenticate, authorize(HR_ACCESS), controller.getAttendanceReport);
router.get("/payroll", authenticate, authorize(PAYROLL_ADMIN), controller.getPayrollReport);
router.get("/benefits", authenticate, authorize(HR_ACCESS), controller.getBenefitsReport);
router.get("/performance", authenticate, authorize(HR_ACCESS), controller.getPerformanceReport);
router.get("/export", authenticate, authorize(ALL_REPORTS), controller.exportReport);

module.exports = router;
