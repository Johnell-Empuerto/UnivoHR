const express = require("express");
const router = express.Router({ mergeParams: true });
const controller = require("../controllers/employeeEducation.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.use(authenticate);

router.get("/", requirePermission("employees.view"), controller.getByEmployeeId);
router.post("/", requirePermission("employees.edit"), controller.create);
router.put("/:id", requirePermission("employees.edit"), controller.update);
router.delete("/:id", requirePermission("employees.edit"), controller.remove);

module.exports = router;
