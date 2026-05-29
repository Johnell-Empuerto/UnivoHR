const express = require("express");
const router = express.Router();
const controller = require("../controllers/finalPay.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

const PAYROLL_ADMIN = [ROLES.ADMIN, ROLES.PAYROLL_USER];

router.get("/employees", authenticate, authorize(PAYROLL_ADMIN), controller.getEmployeesForFinalPay);
router.get("/calculate/:employeeId", authenticate, authorize(PAYROLL_ADMIN), controller.calculateFinalPay);
router.post("/process/:employeeId", authenticate, authorize(PAYROLL_ADMIN), controller.processFinalPay);
router.get("/history", authenticate, authorize(PAYROLL_ADMIN), controller.getFinalPayHistory);
router.get("/:id", authenticate, authorize(PAYROLL_ADMIN), controller.getFinalPayById);
router.get("/:id/download", authenticate, authorize(PAYROLL_ADMIN), controller.downloadFinalPaySlip);

module.exports = router;
