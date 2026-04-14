const express = require("express");
const router = express.Router();

const controller = require("../controllers/attendance.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const ROLES = require("../constants/roles");

const Joi = require("joi");

// ==========================
// VALIDATION
// ==========================
const timeModificationSchema = Joi.object({
  attendance_id: Joi.number().integer().required(),
  requested_check_in: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(),
  requested_check_out: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(),
  reason: Joi.string().min(5).max(500).required(),
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid("APPROVED", "REJECTED").required(),
  rejection_reason: Joi.when("status", {
    is: "REJECTED",
    then: Joi.string().min(5).max(500).required(),
    otherwise: Joi.allow(null, ""),
  }),
});

// ==========================
// 🔥 TIME REQUEST ROUTES FIRST (IMPORTANT)
// ==========================

// CREATE
router.post(
  "/time-requests",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  validate(timeModificationSchema),
  controller.createTimeModificationRequest,
);

// GET MY
router.get(
  "/time-requests/my",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getMyTimeModificationRequests,
);

// GET ALL
router.get(
  "/time-requests",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.getTimeModificationRequests,
);

// UPDATE STATUS
router.put(
  "/time-requests/:id/status",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  validate(statusUpdateSchema),
  controller.updateTimeModificationStatus,
);

// ==========================
// 🔥 ATTENDANCE ROUTES AFTER
// ==========================

// CREATE ATTENDANCE
router.post(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.createAttendance,
);

// GET ALL
router.get(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getAttendance,
);

//  GENERIC ROUTE MUST BE LAST
router.get(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.EMPLOYEE]),
  controller.getByEmployee,
);

module.exports = router;
