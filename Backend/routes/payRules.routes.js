const express = require("express");
const router = express.Router();

const calendarController = require("../controllers/payRules.controller");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// Pay Rules CRUD

//  GET ALL
router.get(
  "/pay-rules",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN]),
  calendarController.getAllPayRules,
);

//  GET BY ID
router.get(
  "/pay-rules/:id",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN]),
  calendarController.getPayRuleById,
);

//  CREATE
router.post(
  "/pay-rules",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN]),
  calendarController.createPayRule,
);

//  UPDATE
router.put(
  "/pay-rules/:id",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN]),
  calendarController.updatePayRule,
);

//  DELETE (STRICT)
router.delete(
  "/pay-rules/:id",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  calendarController.deletePayRule,
);

// Calendar Days

//  GET
router.get(
  "/calendar-days",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN]),
  calendarController.getCalendarDays,
);

// UPSERT (create/update)
router.post(
  "/calendar-days",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN, ROLES.ADMIN]),
  calendarController.upsertCalendarDay,
);

// DELETE (STRICT)
router.delete(
  "/calendar-days/:date",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  calendarController.deleteCalendarDay,
);

module.exports = router;
