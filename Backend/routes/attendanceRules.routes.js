const express = require("express");
const router = express.Router();

const controller = require("../controllers/attendance.controller");

const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

//GET ACTIVE RULE (used by system)
router.get(
  "/active",
  authenticate,
  requirePermission("settings.attendance_rules"),
  controller.getRules,
);

// GET ALL RULES (for CRUD UI)
router.get(
  "/",
  authenticate,
  requirePermission("settings.attendance_rules"),
  controller.getAllRules,
);

// CREATE
router.post(
  "/",
  authenticate,
  requirePermission("settings.attendance_rules"),
  controller.createRule,
);

//  ACTIVATE
router.put(
  "/:id/activate",
  authenticate,
  requirePermission("settings.attendance_rules"),
  controller.setActiveRule,
);

//DELETE (STRICT)
router.delete(
  "/:id",
  authenticate,
  requirePermission("settings.attendance_rules"),
  controller.deleteRule,
);

// UPDATE
router.put(
  "/:id",
  authenticate,
  requirePermission("settings.attendance_rules"),
  controller.updateRule,
);

module.exports = router;
