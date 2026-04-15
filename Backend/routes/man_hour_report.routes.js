const express = require("express");
const router = express.Router();
const controller = require("../controllers/man_hour_report.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// ==========================================
// EMPLOYEE ROUTES
// ==========================================

// GET MY MAN HOUR REPORTS
router.get(
  "/my",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getMyManHourReports,
);

// GET MISSING MAN HOUR DATES (for "No Reports" tab)
router.get(
  "/missing",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getMissingManHourDates,
);

// CREATE MAN HOUR REPORT
router.post(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.createManHourReport,
);

// UPDATE MY MAN HOUR REPORT
router.put(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.updateManHourReport,
);

// DELETE MY MAN HOUR REPORT
router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.deleteManHourReport,
);

// THIS IS THE FIX - Allow EMPLOYEE role to access this endpoint
router.get(
  "/is-approver",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
);

// ==========================================
// GET MAN HOUR REPORT DETAILS - Allow EMPLOYEE to view own reports
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

    // EMPLOYEE can only view their own man hour reports
    if (userRole === "EMPLOYEE") {
      try {
        const pool = require("../config/db");
        const result = await pool.query(
          `SELECT employee_id FROM man_hour_reports WHERE id = $1`,
          [id],
        );

        if (
          result.rows.length > 0 &&
          result.rows[0].employee_id === employeeId
        ) {
          return next(); // Allow access to own report
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
          AND (approval_type = 'MAN_HOUR' OR approval_type = 'ALL')
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
  controller.getManHourReportDetails,
);

// ==========================================
// ADMIN/HR/APPROVER ROUTES - GET ALL
// ==========================================

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

    // Check if user is an approver for man hour reports
    try {
      const pool = require("../config/db");
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM employee_approvers
          WHERE approver_id = $1
          AND (approval_type = 'MAN_HOUR' OR approval_type = 'ALL')
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
  controller.getAllManHourReports,
);

// ==========================================
// APPROVE/REJECT ROUTES
// ==========================================

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
          AND (approval_type = 'MAN_HOUR' OR approval_type = 'ALL')
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
  controller.approveManHourReport,
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
          AND (approval_type = 'MAN_HOUR' OR approval_type = 'ALL')
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
  controller.rejectManHourReport,
);

// ==========================================
// SUMMARY/REPORTING ROUTES (ADMIN/HR ONLY)
// ==========================================

router.get(
  "/summary/range",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.getManHourSummary,
);

module.exports = router;
