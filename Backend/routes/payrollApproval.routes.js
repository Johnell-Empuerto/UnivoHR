const express = require("express");
const router = express.Router();
const controller = require("../controllers/payrollApproval.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.post("/", authenticate, requirePermission("payroll.manage"), controller.createApprovalRequest);
router.get("/", authenticate, requirePermission("payroll.view"), controller.getApprovalRequests);
router.patch("/:id/review", authenticate, requirePermission("payroll.manage"), controller.reviewApprovalRequest);

module.exports = router;
