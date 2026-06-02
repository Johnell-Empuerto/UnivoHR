const express = require("express");
const router = express.Router();

const controller = require("../controllers/employeeRestDay.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/:employeeId", authenticate, requirePermission("employees.view"), controller.getByEmployee);
router.post("/:employeeId", authenticate, requirePermission("employees.edit"), controller.create);
router.put("/:id", authenticate, requirePermission("employees.edit"), controller.update);
router.delete("/:id", authenticate, requirePermission("employees.delete"), controller.remove);

module.exports = router;
