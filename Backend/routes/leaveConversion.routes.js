const express = require("express");
const router = express.Router();

const controller = require("../controllers/leaveConversion.controller");
const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");
const authenticate = require("../middleware/auth.middleware");

// ==========================================
// EXISTING ROUTES - Leave Types & Settings
// ==========================================

const ALL = [ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER, ROLES.EMPLOYEE];
const ADMIN_ONLY = [ROLES.ADMIN];
const HR_ACCESS = [ROLES.ADMIN, ROLES.HR_USER];
const PAYROLL_ADMIN = [ROLES.ADMIN, ROLES.PAYROLL_USER];

router.get("/types", authenticate, authorize(ADMIN_ONLY), controller.getLeaveTypes);
router.put("/types/:id", authenticate, authorize(ADMIN_ONLY), controller.updateLeaveType);
router.get("/settings", authenticate, authorize(ADMIN_ONLY), controller.getSettings);
router.put("/settings", authenticate, authorize(ADMIN_ONLY), controller.updateSettings);
router.post("/save-all", authenticate, authorize(ADMIN_ONLY), controller.saveAll);

router.post("/trigger-year-end", authenticate, authorize(ADMIN_ONLY), controller.triggerYearEndConversion);
router.post("/resignation/:employee_id", authenticate, authorize(ADMIN_ONLY), controller.processResignationConversion);

router.get("/payroll-amount/:employee_id", authenticate, authorize(PAYROLL_ADMIN), controller.getPayrollAmount);
router.get("/history/:employee_id", authenticate, authorize(HR_ACCESS), controller.getConversionHistory);
router.get("/year/:year", authenticate, authorize(ADMIN_ONLY), controller.getConversionsByYear);
router.get("/stats", authenticate, authorize(ADMIN_ONLY), controller.getConversionStats);
router.delete("/:employee_id/:year/:leave_type", authenticate, authorize(ADMIN_ONLY), controller.deleteConversion);

router.get("/history", authenticate, authorize(ADMIN_ONLY), controller.getHistoryLeave);
router.get("/summary", authenticate, authorize(ADMIN_ONLY), controller.getHistoryLeaveSummary);
router.get("/yearly-summary", authenticate, authorize(ADMIN_ONLY), controller.getHistoryLeaveYearlySummary);
router.get("/available-years", authenticate, authorize(ADMIN_ONLY), controller.getHistoryLeaveAvailableYears);
router.get("/employee/:employee_id", authenticate, authorize(ALL), controller.getHistoryLeaveEmployeeSummary);

module.exports = router;
