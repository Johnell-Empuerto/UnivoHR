const express = require("express");
const router = express.Router();

const controller = require("../controllers/payroll.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

//  GENERATE PAYROLL
router.post(
  "/generate",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.generatePayroll,
);

//  VIEW ALL PAYROLL
router.get(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.getPayroll,
);

//  SUMMARY
router.get(
  "/summary",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getPayrollSummary,
);

//  SALARY CONFIG (VERY SENSITIVE ❗)
router.get(
  "/salary",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getEmployeeSalary,
);

router.put(
  "/salary/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.updateEmployeeSalary,
);

//  DEDUCTIONS (VERY SENSITIVE ❗)
router.get(
  "/deductions/:employee_id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getDeductions,
);

router.post(
  "/deductions",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.createDeduction,
);

router.put(
  "/deductions/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.updateDeduction,
);

router.delete(
  "/deductions/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.deleteDeduction,
);

// MARK AS PAID (CRITICAL ❗)
router.patch(
  "/:id/pay",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.markAsPaid,
);

router.patch(
  "/mark-all-paid",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.markAllAsPaid,
);

//  DELETE PAYROLL (DANGEROUS ❗)
router.delete(
  "/delete-cutoff",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.deletePayrollByCutoff,
);

//  EMPLOYEE VIEW OWN PAYROLL
router.get(
  "/my",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getMyPayroll,
);

//  EMPLOYEE SALARY VIEW (OWN)
router.get(
  "/my/salary",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.getMySalaryDetails,
);

router.get(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.getPayrollById,
);

//  PAYSLIP DOWNLOAD (handled in controller check)
router.get(
  "/:id/payslip",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  controller.downloadPayslip,
);

module.exports = router;
