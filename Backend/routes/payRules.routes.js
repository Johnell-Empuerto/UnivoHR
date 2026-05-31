const express = require("express");
const router = express.Router();

const calendarController = require("../controllers/payRules.controller");

const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

// Pay Rules CRUD

//  GET ALL
router.get(
  "/pay-rules",
  authenticate,
  requirePermission("payroll.settings"),
  calendarController.getAllPayRules,
);

//  GET BY ID
router.get(
  "/pay-rules/:id",
  authenticate,
  requirePermission("payroll.settings"),
  calendarController.getPayRuleById,
);

//  CREATE
router.post(
  "/pay-rules",
  authenticate,
  requirePermission("payroll.settings"),
  calendarController.createPayRule,
);

//  UPDATE
router.put(
  "/pay-rules/:id",
  authenticate,
  requirePermission("payroll.settings"),
  calendarController.updatePayRule,
);

//  DELETE (STRICT)
router.delete(
  "/pay-rules/:id",
  authenticate,
  requirePermission("payroll.settings"),
  calendarController.deletePayRule,
);

// Calendar Days

//  GET
router.get(
  "/calendar-days",
  authenticate,
  requirePermission("payroll.settings"),
  calendarController.getCalendarDays,
);

// UPSERT (create/update)
router.post(
  "/calendar-days",
  authenticate,
  requirePermission("payroll.settings"),
  calendarController.upsertCalendarDay,
);

// DELETE (STRICT)
router.delete(
  "/calendar-days/:date",
  authenticate,
  requirePermission("payroll.settings"),
  calendarController.deleteCalendarDay,
);

module.exports = router;
