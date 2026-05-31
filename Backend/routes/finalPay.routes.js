const express = require("express");
const router = express.Router();
const controller = require("../controllers/finalPay.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/employees", authenticate, requirePermission("finalpay.view"), controller.getEmployeesForFinalPay);
router.get("/calculate/:employeeId", authenticate, requirePermission("finalpay.view"), controller.calculateFinalPay);
router.post("/process/:employeeId", authenticate, requirePermission("finalpay.manage"), controller.processFinalPay);
router.get("/history", authenticate, requirePermission("finalpay.view"), controller.getFinalPayHistory);
router.get("/:id", authenticate, requirePermission("finalpay.view"), controller.getFinalPayById);
router.get("/:id/download", authenticate, requirePermission("finalpay.view"), controller.downloadFinalPaySlip);

module.exports = router;
