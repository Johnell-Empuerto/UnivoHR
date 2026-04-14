const express = require("express");
const router = express.Router();
const controller = require("../controllers/historyLeave.controller");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// All routes require authentication
router.use(authorize([ROLES.ADMIN, ROLES.HR_ADMIN]));

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
