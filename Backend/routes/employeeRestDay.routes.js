const express = require("express");
const router = express.Router({ mergeParams: true });

const controller = require("../controllers/employeeRestDay.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/", authenticate, requirePermission("employees.view"), controller.getByEmployee);
router.post("/", authenticate, requirePermission("employees.edit"), controller.create);
router.put("/", authenticate, requirePermission("employees.edit"), controller.update);
router.delete("/", authenticate, requirePermission("employees.delete"), controller.remove);

module.exports = router;
