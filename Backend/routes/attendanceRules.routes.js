const express = require("express");
const router = express.Router();

const controller = require("../controllers/attendance.controller");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

//GET ACTIVE RULE (used by system)
router.get(
  "/active",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN]),
  controller.getRules,
);

// GET ALL RULES (for CRUD UI)
router.get(
  "/",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN]),
  controller.getAllRules,
);

// CREATE
router.post(
  "/",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN]),
  controller.createRule,
);

//  ACTIVATE
router.put(
  "/:id/activate",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN]),
  controller.setActiveRule,
);

//DELETE (STRICT)
router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]), // ONLY SYSTEM_ADMIN
  controller.deleteRule,
);

// UPDATE
router.put(
  "/:id",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN]),
  controller.updateRule,
);

module.exports = router;
