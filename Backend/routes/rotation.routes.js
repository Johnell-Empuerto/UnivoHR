const express = require("express");
const router = express.Router();

const controller = require("../controllers/rotation.controller");

const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

// Groups
router.get("/groups", authenticate, requirePermission("settings.attendance_rules"), controller.getGroups);
router.get("/groups/:id", authenticate, requirePermission("settings.attendance_rules"), controller.getGroupById);
router.post("/groups", authenticate, requirePermission("settings.attendance_rules"), controller.createGroup);
router.put("/groups/:id", authenticate, requirePermission("settings.attendance_rules"), controller.updateGroup);
router.delete("/groups/:id", authenticate, requirePermission("settings.attendance_rules"), controller.deleteGroup);

// Group Members
router.get("/groups/:id/members", authenticate, requirePermission("settings.attendance_rules"), controller.getGroupMembers);
router.post("/groups/:id/members", authenticate, requirePermission("settings.attendance_rules"), controller.addGroupMembers);
router.put("/groups/:id/members/:employeeId", authenticate, requirePermission("settings.attendance_rules"), controller.removeGroupMember);

// Employee Rotation History
router.get("/employees/:employeeId/assignments", authenticate, requirePermission("settings.attendance_rules"), controller.getEmployeeAssignments);
router.put("/employees/:employeeId/assignments/:id", authenticate, requirePermission("settings.attendance_rules"), controller.updateEmployeeAssignment);

// Patterns
router.get("/patterns", authenticate, requirePermission("settings.attendance_rules"), controller.getPatterns);
router.get("/patterns/:id", authenticate, requirePermission("settings.attendance_rules"), controller.getPatternById);
router.post("/patterns", authenticate, requirePermission("settings.attendance_rules"), controller.createPattern);
router.put("/patterns/:id", authenticate, requirePermission("settings.attendance_rules"), controller.updatePattern);
router.delete("/patterns/:id", authenticate, requirePermission("settings.attendance_rules"), controller.deletePattern);

// Group Assignments
router.get("/assignments", authenticate, requirePermission("settings.attendance_rules"), controller.getAssignments);
router.post("/assignments", authenticate, requirePermission("settings.attendance_rules"), controller.createAssignment);
router.put("/assignments/:id", authenticate, requirePermission("settings.attendance_rules"), controller.updateAssignment);
router.delete("/assignments/:id", authenticate, requirePermission("settings.attendance_rules"), controller.deleteAssignment);

// Resolution
router.get("/employee/:employeeId/date/:date", authenticate, controller.resolveEmployeeShift);

module.exports = router;
