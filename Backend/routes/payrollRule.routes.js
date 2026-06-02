const express = require("express");
const router = express.Router();

const controller = require("../controllers/payrollRule.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/", authenticate, requirePermission("payroll.settings"), controller.getAll);
router.get("/:key", authenticate, requirePermission("payroll.settings"), controller.getByKey);
router.put("/:key", authenticate, requirePermission("payroll.settings"), controller.update);

module.exports = router;
