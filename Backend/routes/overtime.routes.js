const express = require("express");
const router = express.Router();
const controller = require("../controllers/overtime.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// ==========================================
// EMPLOYEE ROUTES
// ==========================================

router.get(
  "/my",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getMyOvertime,
);

router.post(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.createOvertime,
);

// ==========================================
// APPROVER MAPPINGS ROUTES
// ==========================================

router.get(
  "/approvers",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getApprovers,
);

router.post(
  "/approvers",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.createApprover,
);

router.put(
  "/approvers/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.updateApprover,
);

router.delete(
  "/approvers/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.deleteApprover,
);

// ==========================================
// EMPLOYEE DROPDOWN
// ==========================================

router.get(
  "/employees/list",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getEmployeesForDropdown,
);

// ==========================================
// CHECK IF USER IS APPROVER
// ==========================================

router.get("/is-approver", authenticate, controller.isApprover);

// ==========================================
// GET OVERTIME DETAILS - Allow EMPLOYEE to view own requests
// ==========================================

router.get(
  "/:id",
  authenticate,
  async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const employeeId = req.user.employee_id;

    // ADMIN, HR_ADMIN, HR have full access
    if (userRole === "ADMIN" || userRole === "HR_ADMIN" || userRole === "HR") {
      return next();
    }

    // EMPLOYEE can only view their OWN overtime requests
    if (userRole === "EMPLOYEE") {
      try {
        const pool = require("../config/db");
        // Check if this overtime request belongs to this employee
        const result = await pool.query(
          `SELECT employee_id FROM overtime_requests WHERE id = $1`,
          [id],
        );

        if (
          result.rows.length > 0 &&
          result.rows[0].employee_id === employeeId
        ) {
          return next(); // Allow access to own request
        }
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    }

    // Check if user is an approver
    try {
      const pool = require("../config/db");
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM employee_approvers 
          WHERE approver_id = $1
          LIMIT 1
        ) as is_approver`,
        [userId],
      );

      if (result.rows[0].is_approver) {
        return next();
      }
    } catch (error) {
      console.error("Error checking approver status:", error);
    }

    return res.status(403).json({
      message: "Forbidden: Insufficient permissions",
      required: ["ADMIN", "HR_ADMIN", "HR", "APPROVER", "OWNER"],
      yourRole: userRole,
    });
  },
  controller.getOvertimeDetails,
);

// ADMIN/HR/APPROVER ROUTES

router.get(
  "/",
  authenticate,
  async (req, res, next) => {
    // Check if user has admin/HR role
    if (
      req.user.role === "ADMIN" ||
      req.user.role === "HR_ADMIN" ||
      req.user.role === "HR"
    ) {
      return next();
    }

    // Check if user is an approver
    try {
      const pool = require("../config/db");
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM employee_approvers 
          WHERE approver_id = $1
          LIMIT 1
        ) as is_approver`,
        [req.user.id],
      );

      if (result.rows[0].is_approver) {
        return next();
      }
    } catch (error) {
      console.error("Error checking approver status:", error);
    }

    return res.status(403).json({
      message: "Forbidden: Insufficient permissions",
      required: ["ADMIN", "HR_ADMIN", "HR", "APPROVER"],
      yourRole: req.user.role,
    });
  },
  controller.getAllOvertime,
);

// APPROVE/REJECT ROUTES

router.put(
  "/:id/approve",
  authenticate,
  async (req, res, next) => {
    if (
      req.user.role === "ADMIN" ||
      req.user.role === "HR_ADMIN" ||
      req.user.role === "HR"
    ) {
      return next();
    }

    try {
      const pool = require("../config/db");
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM employee_approvers 
          WHERE approver_id = $1
          LIMIT 1
        ) as is_approver`,
        [req.user.id],
      );

      if (result.rows[0].is_approver) {
        return next();
      }
    } catch (error) {
      console.error("Error checking approver status:", error);
    }

    return res.status(403).json({
      message: "Forbidden: Insufficient permissions",
      required: ["ADMIN", "HR_ADMIN", "HR", "APPROVER"],
      yourRole: req.user.role,
    });
  },
  controller.approveOvertime,
);

router.put(
  "/:id/reject",
  authenticate,
  async (req, res, next) => {
    if (
      req.user.role === "ADMIN" ||
      req.user.role === "HR_ADMIN" ||
      req.user.role === "HR"
    ) {
      return next();
    }

    try {
      const pool = require("../config/db");
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM employee_approvers 
          WHERE approver_id = $1
          LIMIT 1
        ) as is_approver`,
        [req.user.id],
      );

      if (result.rows[0].is_approver) {
        return next();
      }
    } catch (error) {
      console.error("Error checking approver status:", error);
    }

    return res.status(403).json({
      message: "Forbidden: Insufficient permissions",
      required: ["ADMIN", "HR_ADMIN", "HR", "APPROVER"],
      yourRole: req.user.role,
    });
  },
  controller.rejectOvertime,
);

module.exports = router;
