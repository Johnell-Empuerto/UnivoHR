const express = require("express");
const router = express.Router();

const controller = require("../controllers/employee.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { requireBranchAccessFromQuery, requireBranchAccessFromBody } = require("../middleware/branchAccess.middleware");
const { ROLES } = require("../constants/roles");

// CREATE (ADMIN and HR_USER only — SYSTEM_ADMIN has limited support)
router.post("/", authenticate, authorize([ROLES.ADMIN]), controller.createEmployee);

// GET ALL (WITH FILTERS) — SYSTEM_ADMIN has read-only for support
router.get("/", authenticate, authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER]), requireBranchAccessFromQuery("branch_id"), controller.getEmployees);

// UPDATE
router.put("/:id", authenticate, authorize([ROLES.ADMIN]), requireBranchAccessFromBody("branch_id"), controller.updateEmployee);

module.exports = router;
