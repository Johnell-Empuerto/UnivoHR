const express = require("express");
const router = express.Router();
const controller = require("../controllers/historyLeave.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

// All routes require authentication
router.use(authenticate, requirePermission("leave.view"));

// Get all conversions with pagination and filters
router.get("/", controller.getAll);

// Get summary stats
router.get("/summary", controller.getSummary);

// Get yearly summary
router.get("/yearly-summary", controller.getYearlySummary);

// Get available years
router.get("/available-years", controller.getAvailableYears);

// Get employee summary
router.get("/employee/:employee_id", controller.getEmployeeSummary);

module.exports = router;
