const express = require("express");
const router = express.Router();

const controller = require("../controllers/leave.controller");
const leaveCreditController = require("../controllers/leaveCredit.controller");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");

const { ROLES, normalizeRole } = require("../constants/roles");

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

const HR_ACCESS = [ROLES.ADMIN, ROLES.HR_USER];
const ALL = [ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER, ROLES.EMPLOYEE];
const ADMIN_ONLY = [ROLES.ADMIN];

// Custom middleware to check if user is a leave approver
const canAccessLeaveApprovers = async (req, res, next) => {
  const role = normalizeRole(req.user.role);
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
router.post("/", authenticate, authorize(ALL), validate(leaveSchema), controller.createLeave);

// MY LEAVES
router.get("/my", authenticate, authorize(ALL), controller.getMyLeaves);

// VIEW ALL LEAVES (+ approvers)
router.get("/", authenticate, async (req, res, next) => {
  const role = normalizeRole(req.user.role);
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
}, controller.getLeaves);

// APPROVE / REJECT
router.put("/:id/status", authenticate, async (req, res, next) => {
  const role = normalizeRole(req.user.role);
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
}, controller.updateStatus);

// MY CREDITS
router.get("/credits", authenticate, authorize(ALL), leaveCreditController.getMyCredits);

// CREDITS MANAGEMENT
router.get("/credits/all", authenticate, authorize(ADMIN_ONLY), leaveCreditController.getAllCredits);
router.get("/credits/:employeeId", authenticate, authorize(ADMIN_ONLY), leaveCreditController.getEmployeeCredits);
router.put("/credits/:employeeId", authenticate, authorize(ADMIN_ONLY), leaveCreditController.updateCredits);

module.exports = router;
