const express = require("express");
const router = express.Router();

const controller = require("../controllers/employee.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { requireBranchAccessFromQuery, requireBranchAccessFromBody } = require("../middleware/branchAccess.middleware");

router.post("/", authenticate, requirePermission("employees.create"), controller.createEmployee);
router.get("/", authenticate, requirePermission("employees.view"), requireBranchAccessFromQuery("branch_id"), controller.getEmployees);
router.put("/:id", authenticate, requirePermission("employees.edit"), requireBranchAccessFromBody("branch_id"), controller.updateEmployee);

router.get("/regularization/due", authenticate, requirePermission("employees.edit"), requireBranchAccessFromQuery(), controller.getDueForRegularization);
router.post("/regularization/:id/approve", authenticate, requirePermission("employees.edit"), controller.approveRegularization);
router.get("/employment-stats", authenticate, requirePermission("dashboard.view"), requireBranchAccessFromQuery(), controller.getEmploymentStats);

module.exports = router;
