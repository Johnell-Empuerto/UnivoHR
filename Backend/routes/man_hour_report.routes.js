const express = require("express");
const router = express.Router();
const controller = require("../controllers/man_hour_report.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { ROLES } = require("../constants/roles");
const logger = require("../utils/logger");

const HR_ACCESS = [ROLES.ADMIN];
const ALL = [ROLES.ADMIN, ROLES.EMPLOYEE];

router.get("/my", authenticate, requirePermission("manhours.view"), controller.getMyManHourReports);
router.get("/missing", authenticate, requirePermission("manhours.view"), controller.getMissingManHourDates);
router.post("/", authenticate, requirePermission("manhours.manage"), controller.createManHourReport);
router.put("/:id", authenticate, requirePermission("manhours.manage"), controller.updateManHourReport);
router.delete("/:id", authenticate, requirePermission("manhours.manage"), controller.deleteManHourReport);

router.get("/is-approver", authenticate, requirePermission("manhours.view"), controller.isApprover);
router.get("/download", authenticate, requirePermission("manhours.view"), controller.downloadManHourReports);

router.get("/:id", authenticate, async (req, res, next) => {
  const role = req.user.role;
  if (HR_ACCESS.includes(role)) return next();

  if (role === ROLES.EMPLOYEE) {
    try {
      const pool = require("../config/db");
      const result = await pool.query(
        `SELECT employee_id FROM man_hour_reports WHERE id = $1`,
        [req.params.id],
      );
      if (result.rows.length > 0 && result.rows[0].employee_id === req.user.employee_id) return next();
    } catch (error) {
      logger.error({ err: error }, "Error checking ownership:");
    }
  }

  try {
    const pool = require("../config/db");
    const result = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM employee_approvers WHERE approver_id = $1 AND (approval_type = 'MAN_HOUR' OR approval_type = 'ALL') LIMIT 1) as is_approver`,
      [req.user.id],
    );
    if (result.rows[0].is_approver) return next();
    } catch (error) {
      logger.error({ err: error }, "Error checking approver status:");
    }

  return res.status(403).json({ message: "Forbidden", required: HR_ACCESS, yourRole: role });
}, controller.getManHourReportDetails);

router.get("/", authenticate, async (req, res, next) => {
  const role = req.user.role;
  if (HR_ACCESS.includes(role)) return next();

  try {
    const pool = require("../config/db");
    const result = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM employee_approvers WHERE approver_id = $1 AND (approval_type = 'MAN_HOUR' OR approval_type = 'ALL') LIMIT 1) as is_approver`,
      [req.user.id],
    );
    if (result.rows[0].is_approver) return next();
  } catch (error) {
    logger.error({ err: error }, "Error checking approver status:");
    }

  return res.status(403).json({ message: "Forbidden", required: HR_ACCESS, yourRole: role });
}, controller.getAllManHourReports);

const approveCheck = async (req, res, next) => {
  const role = req.user.role;
  if (HR_ACCESS.includes(role)) return next();
  try {
    const pool = require("../config/db");
    const result = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM employee_approvers WHERE approver_id = $1 AND (approval_type = 'MAN_HOUR' OR approval_type = 'ALL') LIMIT 1) as is_approver`,
      [req.user.id],
    );
    if (result.rows[0].is_approver) return next();
  } catch (error) { logger.error({ err: error }, "Error checking approver status:"); }
  return res.status(403).json({ message: "Forbidden", required: HR_ACCESS, yourRole: role });
};

router.put("/:id/approve", authenticate, approveCheck, controller.approveManHourReport);
router.put("/:id/reject", authenticate, approveCheck, controller.rejectManHourReport);

router.get("/summary/range", authenticate, requirePermission("manhours.view"), controller.getManHourSummary);

module.exports = router;
