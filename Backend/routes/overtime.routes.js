const express = require("express");
const router = express.Router();
const controller = require("../controllers/overtime.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { ROLES } = require("../constants/roles");

const HR_ACCESS = [ROLES.ADMIN];
const ALL = [ROLES.ADMIN, ROLES.EMPLOYEE];
const ADMIN_ONLY = [ROLES.ADMIN];

router.get("/my", authenticate, requirePermission("overtime.view"), controller.getMyOvertime);
router.post("/", authenticate, async (req, res, next) => {
  const { hasPermission } = require("../services/permission.service");
  const canCreate = await hasPermission(req.user, "overtime.create")
                 || await hasPermission(req.user, "overtime.manage");
  if (!canCreate) return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
  next();
}, controller.createOvertime);

router.get("/approvers", authenticate, requirePermission("overtime.manage"), controller.getApprovers);
router.post("/approvers", authenticate, requirePermission("overtime.manage"), controller.createApprover);
router.put("/approvers/:id", authenticate, requirePermission("overtime.manage"), controller.updateApprover);
router.delete("/approvers/:id", authenticate, requirePermission("overtime.manage"), controller.deleteApprover);

router.get("/employees/list", authenticate, requirePermission("overtime.view"), controller.getEmployeesForDropdown);
router.get("/employees/search", authenticate, requirePermission("overtime.view"), controller.searchEmployeesPaginated);
router.get("/is-approver", authenticate, controller.isApprover);

router.get("/:id", authenticate, async (req, res, next) => {
  const role = req.user.role;
  if (HR_ACCESS.includes(role)) return next();

  if (role === ROLES.EMPLOYEE) {
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
  const role = req.user.role;
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
  const role = req.user.role;
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
