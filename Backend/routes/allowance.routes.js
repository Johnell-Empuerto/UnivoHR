const express = require("express");
const router = express.Router();
const controller = require("../controllers/allowance.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/types", authenticate, requirePermission("payroll.view"), controller.getAllowanceTypes);
router.post("/types", authenticate, requirePermission("payroll.manage"), controller.createAllowanceType);
router.put("/types/:id", authenticate, requirePermission("payroll.manage"), controller.updateAllowanceType);
router.delete("/types/:id", authenticate, requirePermission("payroll.manage"), controller.deleteAllowanceType);

router.get("/employee/:employee_id", authenticate, requirePermission("payroll.view"), controller.getEmployeeAllowances);
router.post("/employee", authenticate, requirePermission("payroll.manage"), controller.createEmployeeAllowance);
router.put("/employee/:id", authenticate, requirePermission("payroll.manage"), controller.updateEmployeeAllowance);
router.delete("/employee/:id", authenticate, requirePermission("payroll.manage"), controller.deleteEmployeeAllowance);

module.exports = router;
