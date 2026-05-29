const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeePerformance.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

// Self-scoped — returns only the authenticated user's own data
router.get("/summary", authenticate, authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER, ROLES.EMPLOYEE]), controller.getSummary);
router.get("/probation", authenticate, authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER, ROLES.EMPLOYEE]), controller.getProbationInfo);

module.exports = router;
