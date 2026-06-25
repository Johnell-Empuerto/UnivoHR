const express = require("express");
const router = express.Router();

const controller = require("../controllers/leave.controller");
const leaveCreditController = require("../controllers/leaveCredit.controller");
const leaveTypeController = require("../controllers/leaveType.controller");

const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const validate = require("../middleware/validate.middleware");

const { ROLES } = require("../constants/roles");

// Joi schema for leave validation
const Joi = require("joi");

const leaveSchema = Joi.object({
  type: Joi.string()
    .pattern(/^[A-Z][A-Z_ -]*[A-Z]$/)
    .max(20)
    .required(),

  from_date: Joi.date().required(),
  to_date: Joi.date().min(Joi.ref("from_date")).required(),

  reason: Joi.string().optional().allow(""),

  //  ADD THIS
  day_fraction: Joi.number().valid(0.5, 1).default(1),

  //  ADD THIS (SMART VALIDATION)
  half_day_type: Joi.when("day_fraction", {
    is: 0.5,
    then: Joi.string().valid("MORNING", "AFTERNOON").required(),
    otherwise: Joi.allow(null, ""),
  }),
});

// ==========================================
// LEAVE APPROVERS ROUTE (Allow approvers)
// ==========================================

const HR_ACCESS = [ROLES.ADMIN];

// Custom middleware to check if user is a leave approver
const canAccessLeaveApprovers = async (req, res, next) => {
  const role = req.user.role;
  if (HR_ACCESS.includes(role)) return next();

  try {
    const pool = require("../config/db");
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM employee_approvers 
        WHERE approver_id = $1 
        AND (approval_type = 'LEAVE' OR approval_type = 'ALL')
        LIMIT 1
      ) as is_leave_approver`,
      [req.user.id],
    );
    if (result.rows[0].is_leave_approver) return next();
  } catch (error) {
    console.error("Error checking leave approver status:", error);
  }

  return res.status(403).json({
    message: "Forbidden: Insufficient permissions",
    required: HR_ACCESS,
    yourRole: req.user.role,
  });
};

router.get("/approvers", authenticate, canAccessLeaveApprovers, (req, res) => {
  res.json({ message: "Access granted" });
});

// CREATE LEAVE
router.post(
  "/",
  authenticate,
  requirePermission("leave.view"),
  validate(leaveSchema),
  controller.createLeave,
);

// MY LEAVES
router.get(
  "/my",
  authenticate,
  requirePermission("leave.view"),
  controller.getMyLeaves,
);

// VIEW ALL LEAVES (+ approvers)
router.get(
  "/",
  authenticate,
  async (req, res, next) => {
    const role = req.user.role;
    if (HR_ACCESS.includes(role)) return next();

    try {
      const pool = require("../config/db");
      const result = await pool.query(
        `SELECT EXISTS (
        SELECT 1 FROM employee_approvers 
        WHERE approver_id = $1 
        AND (approval_type = 'LEAVE' OR approval_type = 'ALL')
        LIMIT 1
      ) as is_leave_approver`,
        [req.user.id],
      );
      if (result.rows[0].is_leave_approver) return next();
    } catch (error) {
      console.error("Error checking leave approver status:", error);
    }

    return res.status(403).json({
      message: "Forbidden: Insufficient permissions",
      required: HR_ACCESS,
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
    const role = req.user.role;
    if (HR_ACCESS.includes(role)) return next();

    try {
      const leaveId = req.params.id;
      const pool = require("../config/db");
      const leaveResult = await pool.query(
        `SELECT employee_id FROM leaves WHERE id = $1`,
        [leaveId],
      );
      if (leaveResult.rows.length === 0) {
        return res.status(404).json({ message: "Leave not found" });
      }

      const employeeId = leaveResult.rows[0].employee_id;
      const approverResult = await pool.query(
        `SELECT 1 FROM employee_approvers 
       WHERE employee_id = $1 
       AND approver_id = $2 
       AND (approval_type = 'LEAVE' OR approval_type = 'ALL')
       LIMIT 1`,
        [employeeId, req.user.id],
      );
      if (approverResult.rows.length > 0) return next();
    } catch (error) {
      console.error("Error checking leave approver status:", error);
    }

    return res.status(403).json({
      message: "You are not allowed to approve this leave request",
    });
  },
  controller.updateStatus,
);

// ENABLED LEAVE TYPES (for dynamic dropdown)
router.get("/leave-types", authenticate, async (req, res) => {
  try {
    const pool = require("../config/db");
    const result = await pool.query(`
      SELECT id, code, name, is_enabled, employee_requestable,
             requires_balance, is_unlimited, include_in_credits,
             sort_order, default_days, description
      FROM leave_types
      WHERE is_enabled = true
      ORDER BY sort_order, code
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// MY CREDITS
router.get(
  "/credits",
  authenticate,
  requirePermission("leave.view"),
  leaveCreditController.getMyCredits,
);

// CREDITS MANAGEMENT
router.get(
  "/credits/all",
  authenticate,
  requirePermission("leave.manage"),
  leaveCreditController.getAllCredits,
);
router.get(
  "/credits/:employeeId",
  authenticate,
  requirePermission("leave.manage"),
  leaveCreditController.getEmployeeCredits,
);
router.put(
  "/credits/:employeeId",
  authenticate,
  requirePermission("leave.manage"),
  leaveCreditController.updateCredits,
);

// ==========================================
// LEAVE TYPE MANAGEMENT (Admin/Settings)
// ==========================================

const leaveTypeSchema = Joi.object({
  code: Joi.string()
    .pattern(/^[A-Z][A-Z_ -]*[A-Z]$/)
    .max(20)
    .required(),
  name: Joi.string().max(50).required(),
  description: Joi.string().allow(null, "").optional(),
  is_enabled: Joi.boolean().optional(),
  is_paid: Joi.boolean().optional(),
  is_convertible: Joi.boolean().optional(),
  max_convertible_days: Joi.number().integer().min(0).allow(null).optional(),
  requires_balance: Joi.boolean().optional(),
  default_days: Joi.number().integer().min(0).default(0),
  requires_attachment: Joi.boolean().optional(),
  requires_approval: Joi.boolean().optional(),
  employee_requestable: Joi.boolean().optional(),
  hr_only: Joi.boolean().optional(),
  include_in_credits: Joi.boolean().optional(),
  is_unlimited: Joi.boolean().optional(),
  affects_payroll: Joi.boolean().optional(),
  deducts_salary: Joi.boolean().optional(),
  sort_order: Joi.number().integer().min(0).optional(),
});

const leaveTypeUpdateSchema = Joi.object({
  code: Joi.string()
    .pattern(/^[A-Z][A-Z_ -]*[A-Z]$/)
    .max(20)
    .optional(),
  name: Joi.string().max(50).optional(),
  description: Joi.string().allow(null, "").optional(),
  is_enabled: Joi.boolean().optional(),
  is_paid: Joi.boolean().optional(),
  is_convertible: Joi.boolean().optional(),
  max_convertible_days: Joi.number().integer().min(0).allow(null).optional(),
  requires_balance: Joi.boolean().optional(),
  default_days: Joi.number().integer().min(0).optional(),
  requires_attachment: Joi.boolean().optional(),
  requires_approval: Joi.boolean().optional(),
  employee_requestable: Joi.boolean().optional(),
  hr_only: Joi.boolean().optional(),
  include_in_credits: Joi.boolean().optional(),
  is_unlimited: Joi.boolean().optional(),
  affects_payroll: Joi.boolean().optional(),
  deducts_salary: Joi.boolean().optional(),
  sort_order: Joi.number().integer().min(0).optional(),
});

// All leave types (including disabled) — admin only
router.get(
  "/leave-types/all",
  authenticate,
  requirePermission("leave.manage"),
  leaveTypeController.getAll,
);
// Create leave type
router.post(
  "/leave-types",
  authenticate,
  requirePermission("leave.manage"),
  validate(leaveTypeSchema),
  leaveTypeController.create,
);
// Update leave type
router.put(
  "/leave-types/:id",
  authenticate,
  requirePermission("leave.manage"),
  validate(leaveTypeUpdateSchema),
  leaveTypeController.update,
);
// Toggle enabled
router.patch(
  "/leave-types/:id/toggle",
  authenticate,
  requirePermission("leave.manage"),
  leaveTypeController.toggleEnabled,
);
// Soft delete (disable)
router.delete(
  "/leave-types/:id",
  authenticate,
  requirePermission("leave.manage"),
  leaveTypeController.remove,
);

module.exports = router;
