const express = require("express");
const router = express.Router();

const controller = require("../controllers/leave.controller");
const leaveCreditController = require("../controllers/leaveCredit.controller");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");

const ROLES = require("../constants/roles");

// Joi schema for leave validation
const Joi = require("joi");

const leaveSchema = Joi.object({
  type: Joi.string()
    .valid("SICK", "ANNUAL", "MATERNITY", "EMERGENCY", "NO_PAY")
    .required(),

  from_date: Joi.date().required(),
  to_date: Joi.date().min(Joi.ref("from_date")).required(),

  reason: Joi.string().optional().allow(""),

  // ✅ ADD THIS
  day_fraction: Joi.number().valid(0.5, 1).default(1),

  // ✅ ADD THIS (SMART VALIDATION)
  half_day_type: Joi.when("day_fraction", {
    is: 0.5,
    then: Joi.string().valid("MORNING", "AFTERNOON").required(),
    otherwise: Joi.allow(null, ""),
  }),
});

// ==========================================
// LEAVE APPROVERS ROUTE (Allow approvers)
// ==========================================

// Custom middleware to check if user is a leave approver
const canAccessLeaveApprovers = async (req, res, next) => {
  // ADMIN and HR_ADMIN have full access
  if (req.user.role === "ADMIN" || req.user.role === "HR_ADMIN") {
    return next();
  }

  // HR can also access
  if (req.user.role === "HR") {
    return next();
  }

  // Check if user is assigned as a leave approver for anyone
  try {
    const pool = require("../config/db");
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM employee_approvers 
        WHERE approver_id = $1 
        AND approval_type = 'LEAVE'
        LIMIT 1
      ) as is_leave_approver`,
      [req.user.id],
    );

    if (result.rows[0].is_leave_approver) {
      return next();
    }
  } catch (error) {
    console.error("Error checking leave approver status:", error);
  }

  return res.status(403).json({
    message: "Forbidden: Insufficient permissions",
    required: ["ADMIN", "HR_ADMIN", "HR", "LEAVE_APPROVER"],
    yourRole: req.user.role,
  });
};

// LEAVE APPROVERS PAGE ROUTE
router.get("/approvers", authenticate, canAccessLeaveApprovers, (req, res) => {
  // This just allows the page to load - the actual data comes from the API
  res.json({ message: "Access granted" });
});

// ==========================================
// LEAVE REQUESTS ROUTES
// ==========================================

// CREATE LEAVE (everyone)
router.post(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  validate(leaveSchema),
  controller.createLeave,
);

// MY LEAVES (everyone)
router.get(
  "/my",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getMyLeaves,
);

// VIEW ALL LEAVES (HR side + approvers)
router.get(
  "/",
  authenticate,
  async (req, res, next) => {
    // ADMIN, HR_ADMIN, HR have full access
    if (
      req.user.role === "ADMIN" ||
      req.user.role === "HR_ADMIN" ||
      req.user.role === "HR"
    ) {
      return next();
    }

    // Check if user is a leave approver
    try {
      const pool = require("../config/db");
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM employee_approvers 
          WHERE approver_id = $1 
          AND approval_type = 'LEAVE'
          LIMIT 1
        ) as is_leave_approver`,
        [req.user.id],
      );

      if (result.rows[0].is_leave_approver) {
        return next();
      }
    } catch (error) {
      console.error("Error checking leave approver status:", error);
    }

    return res.status(403).json({
      message: "Forbidden: Insufficient permissions",
      required: ["ADMIN", "HR_ADMIN", "HR", "LEAVE_APPROVER"],
      yourRole: req.user.role,
    });
  },
  controller.getLeaves,
);

// APPROVE / REJECT
router.put(
  "/:id/status",
  authenticate,
  async (req, res, next) => {
    // ADMIN, HR_ADMIN, HR have full access
    if (
      req.user.role === "ADMIN" ||
      req.user.role === "HR_ADMIN" ||
      req.user.role === "HR"
    ) {
      return next();
    }

    // Check if user is a leave approver for this specific employee
    try {
      const leaveId = req.params.id;
      const pool = require("../config/db");

      // First get the employee_id from the leave request
      const leaveResult = await pool.query(
        `SELECT employee_id FROM leaves WHERE id = $1`,
        [leaveId],
      );

      if (leaveResult.rows.length === 0) {
        return res.status(404).json({ message: "Leave not found" });
      }

      const employeeId = leaveResult.rows[0].employee_id;

      // Check if user is assigned as approver for this employee
      const approverResult = await pool.query(
        `SELECT 1 FROM employee_approvers 
         WHERE employee_id = $1 
         AND approver_id = $2 
         AND approval_type = 'LEAVE'
         LIMIT 1`,
        [employeeId, req.user.id],
      );

      if (approverResult.rows.length > 0) {
        return next();
      }
    } catch (error) {
      console.error("Error checking leave approver status:", error);
    }

    return res.status(403).json({
      message: "You are not allowed to approve this leave request",
    });
  },
  controller.updateStatus,
);

// LEAVE CREDITS (everyone) - MY CREDITS
router.get(
  "/credits",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  leaveCreditController.getMyCredits,
);

// ==========================================
// LEAVE CREDITS MANAGEMENT (ADMIN/HR_ADMIN ONLY)
// ==========================================

// GET ALL CREDITS (ADMIN/HR_ADMIN)
router.get(
  "/credits/all",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  leaveCreditController.getAllCredits,
);

// GET SINGLE EMPLOYEE CREDITS (ADMIN/HR_ADMIN)
router.get(
  "/credits/:employeeId",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  leaveCreditController.getEmployeeCredits,
);

// UPDATE EMPLOYEE CREDITS (ADMIN/HR_ADMIN)
router.put(
  "/credits/:employeeId",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  leaveCreditController.updateCredits,
);

module.exports = router;
