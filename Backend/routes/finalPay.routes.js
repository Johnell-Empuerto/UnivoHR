const express = require("express");
const router = express.Router();
const controller = require("../controllers/finalPay.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// Get employees for final pay (RESIGNED/TERMINATED)
router.get(
  "/employees",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.getEmployeesForFinalPay,
);

// Calculate final pay preview
router.get(
  "/calculate/:employeeId",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.calculateFinalPay,
);

// Process final pay
router.post(
  "/process/:employeeId",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.processFinalPay,
);

// Get final pay history (NEW)
router.get(
  "/history",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.getFinalPayHistory,
);

// Get final pay by ID
router.get(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.getFinalPayById,
);

// Download final pay slip
router.get(
  "/:id/download",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.downloadFinalPaySlip,
);

module.exports = router;
