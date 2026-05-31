const express = require("express");
const router = express.Router();

const controller = require("../controllers/attendance.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { requireBranchAccessFromQuery } = require("../middleware/branchAccess.middleware");
const validate = require("../middleware/validate.middleware");
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
//  TIME REQUEST ROUTES FIRST (IMPORTANT)
// ==========================

// TIME REQUESTS
router.post("/time-requests", authenticate, requirePermission("attendance.manage"), validate(timeModificationSchema), controller.createTimeModificationRequest);
router.get("/time-requests/my", authenticate, requirePermission("attendance.view"), controller.getMyTimeModificationRequests);
router.get("/time-requests", authenticate, requirePermission("attendance.view"), controller.getTimeModificationRequests);
router.put("/time-requests/:id/status", authenticate, requirePermission("attendance.manage"), validate(statusUpdateSchema), controller.updateTimeModificationStatus);

// ATTENDANCE
router.post("/", authenticate, requirePermission("attendance.manage"), controller.createAttendance);
router.get("/", authenticate, requirePermission("attendance.view"), requireBranchAccessFromQuery("branch_id"), controller.getAttendance);
router.get("/:id", authenticate, requirePermission("attendance.view"), controller.getByEmployee);

module.exports = router;
