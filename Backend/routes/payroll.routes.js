const express = require("express");
const router = express.Router();

const controller = require("../controllers/payroll.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const payrollLock = require("../middleware/payrollLock.middleware");
const { requireBranchAccessFromQuery, requireBranchAccessFromBody } = require("../middleware/branchAccess.middleware");

//  LOCK / UNLOCK / VOID PAYROLL
router.patch("/:id/lock", authenticate, requirePermission("payroll.manage"), controller.lockPayroll);
router.patch("/:id/unlock", authenticate, requirePermission("payroll.manage"), controller.unlockPayroll);
router.patch("/:id/void", authenticate, requirePermission("payroll.manage"), controller.voidPayroll);

//  GENERATE PAYROLL
router.post("/generate", authenticate, requirePermission("payroll.generate"), requireBranchAccessFromBody("branch_id"), controller.generatePayroll);

//  VIEW ALL PAYROLL
router.get("/", authenticate, requirePermission("payroll.view"), requireBranchAccessFromQuery("branch_id"), controller.getPayroll);

//  SUMMARY
router.get("/summary", authenticate, requirePermission("payroll.view"), requireBranchAccessFromQuery("branch_id"), controller.getPayrollSummary);

//  SALARY CONFIG
router.get("/salary", authenticate, requirePermission("payroll.view"), controller.getEmployeeSalary);
router.put("/salary/:id", authenticate, requirePermission("payroll.manage"), controller.updateEmployeeSalary);

//  DEDUCTIONS
router.get("/deductions/:employee_id", authenticate, requirePermission("payroll.view"), controller.getDeductions);
router.post("/deductions", authenticate, requirePermission("payroll.manage"), controller.createDeduction);
router.put("/deductions/:id", authenticate, requirePermission("payroll.manage"), controller.updateDeduction);
router.delete("/deductions/:id", authenticate, requirePermission("payroll.manage"), controller.deleteDeduction);

// MARK AS PAID (CRITICAL)
router.patch("/:id/pay", authenticate, requirePermission("payroll.manage"), payrollLock, controller.markAsPaid);
router.patch("/mark-all-paid", authenticate, requirePermission("payroll.manage"), controller.markAllAsPaid);

//  DELETE PAYROLL (DANGEROUS)
router.delete("/delete-cutoff", authenticate, requirePermission("payroll.manage"), controller.deletePayrollByCutoff);

//  EMPLOYEE VIEW OWN PAYROLL
router.get("/my", authenticate, requirePermission("payroll.view"), controller.getMyPayroll);
router.get("/my/benefits", authenticate, controller.getMyBenefits);
router.get("/my/salary", authenticate, requirePermission("payroll.view"), controller.getMySalaryDetails);

router.get("/:id", authenticate, requirePermission("payroll.view"), controller.getPayrollById);

//  PAYSLIP DOWNLOAD (handled in controller check)
router.get("/:id/payslip", authenticate, requirePermission("payroll.view"), controller.downloadPayslip);

module.exports = router;
