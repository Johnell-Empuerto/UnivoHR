const express = require("express");
const router = express.Router();

const controller = require("../controllers/leaveConversion.controller");
const requirePermission = require("../middleware/permission.middleware");
const authenticate = require("../middleware/auth.middleware");

router.get("/types", authenticate, requirePermission("leave.conversion.view"), controller.getLeaveTypes);
router.put("/types/:id", authenticate, requirePermission("leave.conversion.manage"), controller.updateLeaveType);
router.get("/settings", authenticate, requirePermission("leave.conversion.view"), controller.getSettings);
router.put("/settings", authenticate, requirePermission("leave.conversion.manage"), controller.updateSettings);
router.post("/save-all", authenticate, requirePermission("leave.conversion.manage"), controller.saveAll);

router.post("/trigger-year-end", authenticate, requirePermission("leave.conversion.manage"), controller.triggerYearEndConversion);
router.post("/resignation/:employee_id", authenticate, requirePermission("leave.conversion.manage"), controller.processResignationConversion);

router.get("/payroll-amount/:employee_id", authenticate, requirePermission("leave.conversion.view"), controller.getPayrollAmount);
router.get("/history/:employee_id", authenticate, requirePermission("leave.conversion.view"), controller.getConversionHistory);
router.get("/year/:year", authenticate, requirePermission("leave.conversion.view"), controller.getConversionsByYear);
router.get("/stats", authenticate, requirePermission("leave.conversion.view"), controller.getConversionStats);
router.delete("/:employee_id/:year/:leave_type", authenticate, requirePermission("leave.conversion.manage"), controller.deleteConversion);

router.get("/history", authenticate, requirePermission("leave.conversion.view"), controller.getHistoryLeave);
router.get("/summary", authenticate, requirePermission("leave.conversion.view"), controller.getHistoryLeaveSummary);
router.get("/yearly-summary", authenticate, requirePermission("leave.conversion.view"), controller.getHistoryLeaveYearlySummary);
router.get("/available-years", authenticate, requirePermission("leave.conversion.view"), controller.getHistoryLeaveAvailableYears);
router.get("/employee/:employee_id", authenticate, requirePermission("leave.conversion.view"), controller.getHistoryLeaveEmployeeSummary);

module.exports = router;
