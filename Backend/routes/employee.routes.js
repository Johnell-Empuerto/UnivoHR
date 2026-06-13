const express = require("express");
const router = express.Router();

const controller = require("../controllers/employee.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { requireBranchAccessFromQuery, requireBranchAccessFromBody } = require("../middleware/branchAccess.middleware");

// Static routes MUST be declared before /:id
router.get("/search", authenticate, requirePermission("employees.view"), controller.searchEmployees);
router.post("/", authenticate, requirePermission("employees.create"), controller.createEmployee);
router.get("/", authenticate, requirePermission("employees.view"), requireBranchAccessFromQuery("branch_id"), controller.getEmployees);
router.get("/regularization/due", authenticate, requirePermission("employees.edit"), requireBranchAccessFromQuery(), controller.getDueForRegularization);
router.post("/regularization/:id/approve", authenticate, requirePermission("employees.edit"), controller.approveRegularization);
router.get("/employment-stats", authenticate, requirePermission("dashboard.view"), requireBranchAccessFromQuery(), controller.getEmploymentStats);
router.get("/filter-options", authenticate, controller.getFilterOptions);

// Parametric routes — keep after static routes
router.get("/:id", authenticate, requirePermission("employees.view"), controller.getEmployeeById);
router.put("/:id", authenticate, requirePermission("employees.edit"), requireBranchAccessFromBody("branch_id"), controller.updateEmployee);
router.delete("/:id", authenticate, requirePermission("employees.delete"), controller.deleteEmployee);

module.exports = router;
