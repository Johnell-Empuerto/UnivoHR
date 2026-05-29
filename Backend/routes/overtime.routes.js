const express = require("express");
const router = express.Router();
const controller = require("../controllers/overtime.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { ROLES, normalizeRole } = require("../constants/roles");

const HR_ACCESS = [ROLES.ADMIN, ROLES.HR_USER];
const ALL = [ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER, ROLES.EMPLOYEE];
const ADMIN_ONLY = [ROLES.ADMIN];

router.get("/my", authenticate, authorize(ALL), controller.getMyOvertime);
router.post("/", authenticate, authorize(ALL), controller.createOvertime);

router.get("/approvers", authenticate, authorize(ADMIN_ONLY), controller.getApprovers);
router.post("/approvers", authenticate, authorize(ADMIN_ONLY), controller.createApprover);
router.put("/approvers/:id", authenticate, authorize(ADMIN_ONLY), controller.updateApprover);
router.delete("/approvers/:id", authenticate, authorize(ADMIN_ONLY), controller.deleteApprover);

router.get("/employees/list", authenticate, authorize(ADMIN_ONLY), controller.getEmployeesForDropdown);
router.get("/is-approver", authenticate, controller.isApprover);

router.get("/:id", authenticate, async (req, res, next) => {
  const role = normalizeRole(req.user.role);
  if (HR_ACCESS.includes(role)) return next();

  if (role === ROLES.EMPLOYEE || role === ROLES.PAYROLL_USER) {
    try {
      const pool = require("../config/db");
      const result = await pool.query(
        `SELECT employee_id FROM overtime_requests WHERE id = $1`,
        [req.params.id],
      );
      if (result.rows.length > 0 && result.rows[0].employee_id === req.user.employee_id) return next();
    } catch (error) {
      console.error("Error checking ownership:", error);
    }
  }

  try {
    const pool = require("../config/db");
    const result = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM employee_approvers WHERE approver_id = $1 LIMIT 1) as is_approver`,
      [req.user.id],
    );
    if (result.rows[0].is_approver) return next();
  } catch (error) {
    console.error("Error checking approver status:", error);
  }

  return res.status(403).json({ message: "Forbidden: Insufficient permissions", required: HR_ACCESS, yourRole: role });
}, controller.getOvertimeDetails);

router.get("/", authenticate, async (req, res, next) => {
  const role = normalizeRole(req.user.role);
  if (HR_ACCESS.includes(role)) return next();

  try {
    const pool = require("../config/db");
    const result = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM employee_approvers WHERE approver_id = $1 LIMIT 1) as is_approver`,
      [req.user.id],
    );
    if (result.rows[0].is_approver) return next();
  } catch (error) {
    console.error("Error checking approver status:", error);
  }

  return res.status(403).json({ message: "Forbidden", required: HR_ACCESS, yourRole: role });
}, controller.getAllOvertime);

const approveCheck = async (req, res, next) => {
  const role = normalizeRole(req.user.role);
  if (HR_ACCESS.includes(role)) return next();
  try {
    const pool = require("../config/db");
    const result = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM employee_approvers WHERE approver_id = $1 LIMIT 1) as is_approver`,
      [req.user.id],
    );
    if (result.rows[0].is_approver) return next();
  } catch (error) { console.error("Error checking approver status:", error); }
  return res.status(403).json({ message: "Forbidden", required: HR_ACCESS, yourRole: role });
};

router.put("/:id/approve", authenticate, approveCheck, controller.approveOvertime);
router.put("/:id/reject", authenticate, approveCheck, controller.rejectOvertime);

module.exports = router;
