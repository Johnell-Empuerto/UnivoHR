const express = require("express");
const router = express.Router();

const controller = require("../controllers/shift.controller");

const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/active", authenticate, controller.getActiveShifts);

router.get("/", authenticate, requirePermission("settings.attendance_rules"), controller.getAll);
router.get("/:id", authenticate, requirePermission("settings.attendance_rules"), controller.getById);

router.post("/", authenticate, requirePermission("settings.attendance_rules"), controller.create);

router.put("/:id", authenticate, requirePermission("settings.attendance_rules"), controller.update);

router.delete("/:id", authenticate, requirePermission("settings.attendance_rules"), controller.remove);

router.get("/employee/:employeeId/date/:date", authenticate, controller.getEmployeeShiftForDate);

router.post("/assign", authenticate, requirePermission("settings.attendance_rules"), controller.assignShift);

router.get("/assignments/:employeeId", authenticate, controller.getAssignments);

router.delete("/assignments/:id", authenticate, requirePermission("settings.attendance_rules"), controller.removeAssignment);

module.exports = router;
