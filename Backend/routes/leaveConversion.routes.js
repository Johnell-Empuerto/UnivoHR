const express = require("express");
const router = express.Router();

const controller = require("../controllers/leaveConversion.controller");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");
const authenticate = require("../middleware/auth.middleware");

// ==========================================
// EXISTING ROUTES - Leave Types & Settings
// ==========================================

// LEAVE TYPES
router.get(
  "/types",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getLeaveTypes
);

router.put(
  "/types/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.updateLeaveType
);

// COMPANY SETTINGS
router.get(
  "/settings",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getSettings
);

router.put(
  "/settings",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.updateSettings
);

// SAVE ALL
router.post(
  "/save-all",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.saveAll
);

// ==========================================
// NEW ROUTES - YEAR-END CONVERSION SYSTEM
// ==========================================

// TRIGGER YEAR-END CONVERSION (Admin/HR Admin only)
router.post(
  "/trigger-year-end",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.triggerYearEndConversion
);

// PROCESS RESIGNATION CONVERSION (Admin/HR Admin only)
router.post(
  "/resignation/:employee_id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.processResignationConversion
);

// GET CONVERSION AMOUNT FOR PAYROLL (Admin/HR/Payroll)
router.get(
  "/payroll-amount/:employee_id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.getPayrollAmount
);

// GET EMPLOYEE CONVERSION HISTORY (Admin/HR Admin)
router.get(
  "/history/:employee_id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.getConversionHistory
);

// GET CONVERSIONS BY YEAR (Admin/HR Admin)
router.get(
  "/year/:year",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getConversionsByYear
);

// GET CONVERSION STATISTICS (Admin/HR Admin)
router.get(
  "/stats",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getConversionStats
);

// DELETE CONVERSION (Admin only - dangerous operation)
router.delete(
  "/:employee_id/:year/:leave_type",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.deleteConversion
);

// ==========================================
// HISTORY LEAVE ROUTES (Existing functionality)
// ==========================================

// GET ALL LEAVE CONVERSIONS (with pagination)
router.get(
  "/history",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getHistoryLeave
);

// GET SUMMARY STATS
router.get(
  "/summary",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getHistoryLeaveSummary
);

// GET YEARLY SUMMARY
router.get(
  "/yearly-summary",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getHistoryLeaveYearlySummary
);

// GET AVAILABLE YEARS
router.get(
  "/available-years",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getHistoryLeaveAvailableYears
);

// GET EMPLOYEE SUMMARY
router.get(
  "/employee/:employee_id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getHistoryLeaveEmployeeSummary
);

module.exports = router;
