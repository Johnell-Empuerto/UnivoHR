const express = require("express");
const router = express.Router();

const controller = require("../controllers/payroll.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const payrollLock = require("../middleware/payrollLock.middleware");
const { requireBranchAccessFromQuery, requireBranchAccessFromBody } = require("../middleware/branchAccess.middleware");
const { ROLES } = require("../constants/roles");

const PAYROLL_ADMIN = [ROLES.ADMIN, ROLES.PAYROLL_USER];
const PAYROLL_SELF = [ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER, ROLES.EMPLOYEE];
const PAYROLL_VIEW = [ROLES.ADMIN, ROLES.PAYROLL_USER];

//  LOCK / UNLOCK / VOID PAYROLL
router.patch("/:id/lock", authenticate, authorize(PAYROLL_ADMIN), controller.lockPayroll);
router.patch("/:id/unlock", authenticate, authorize(PAYROLL_ADMIN), controller.unlockPayroll);
router.patch("/:id/void", authenticate, authorize(PAYROLL_ADMIN), controller.voidPayroll);

//  GENERATE PAYROLL
router.post("/generate", authenticate, authorize(PAYROLL_ADMIN), requireBranchAccessFromBody("branch_id"), controller.generatePayroll);

//  VIEW ALL PAYROLL
router.get("/", authenticate, authorize(PAYROLL_VIEW), requireBranchAccessFromQuery("branch_id"), controller.getPayroll);

//  SUMMARY
router.get("/summary", authenticate, authorize(PAYROLL_VIEW), requireBranchAccessFromQuery("branch_id"), controller.getPayrollSummary);

//  SALARY CONFIG
router.get("/salary", authenticate, authorize(PAYROLL_ADMIN), controller.getEmployeeSalary);
router.put("/salary/:id", authenticate, authorize(PAYROLL_ADMIN), controller.updateEmployeeSalary);

//  DEDUCTIONS
router.get("/deductions/:employee_id", authenticate, authorize(PAYROLL_ADMIN), controller.getDeductions);
router.post("/deductions", authenticate, authorize(PAYROLL_ADMIN), controller.createDeduction);
router.put("/deductions/:id", authenticate, authorize(PAYROLL_ADMIN), controller.updateDeduction);
router.delete("/deductions/:id", authenticate, authorize(PAYROLL_ADMIN), controller.deleteDeduction);

// MARK AS PAID (CRITICAL)
router.patch("/:id/pay", authenticate, authorize(PAYROLL_ADMIN), payrollLock, controller.markAsPaid);
router.patch("/mark-all-paid", authenticate, authorize(PAYROLL_ADMIN), controller.markAllAsPaid);

//  DELETE PAYROLL (DANGEROUS)
router.delete("/delete-cutoff", authenticate, authorize(PAYROLL_ADMIN), controller.deletePayrollByCutoff);

//  EMPLOYEE VIEW OWN PAYROLL
router.get("/my", authenticate, authorize(PAYROLL_SELF), controller.getMyPayroll);
router.get("/my/benefits", authenticate, authorize(PAYROLL_SELF), controller.getMyBenefits);
router.get("/my/salary", authenticate, authorize(PAYROLL_SELF), controller.getMySalaryDetails);

router.get("/:id", authenticate, authorize(PAYROLL_VIEW), controller.getPayrollById);

//  PAYSLIP DOWNLOAD (handled in controller check)
router.get("/:id/payslip", authenticate, authorize([...PAYROLL_VIEW, ROLES.EMPLOYEE]), controller.downloadPayslip);

module.exports = router;
