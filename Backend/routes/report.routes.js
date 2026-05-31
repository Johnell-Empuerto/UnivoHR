const express = require("express");
const router = express.Router();

const controller = require("../controllers/report.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/employees", authenticate, requirePermission("reports.employee"), controller.getEmployeeReport);
router.get("/leaves", authenticate, requirePermission("reports.attendance"), controller.getLeaveReport);
router.get("/attendance", authenticate, requirePermission("reports.attendance"), controller.getAttendanceReport);
router.get("/payroll", authenticate, requirePermission("reports.payroll"), controller.getPayrollReport);
router.get("/benefits", authenticate, requirePermission("reports.employee"), controller.getBenefitsReport);
router.get("/performance", authenticate, requirePermission("reports.employee"), controller.getPerformanceReport);
router.get("/export", authenticate, requirePermission("reports.view"), controller.exportReport);

module.exports = router;
