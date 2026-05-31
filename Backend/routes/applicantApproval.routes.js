const express = require("express");
const router = express.Router();

const controller = require("../controllers/applicantApproval.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/:applicantId",
  authenticate,
  requirePermission("recruitment.approvals.manage"),
  controller.getByApplicantId,
);

router.post(
  "/:applicantId",
  authenticate,
  requirePermission("recruitment.approvals.manage"),
  controller.create,
);

router.put("/:id", authenticate, requirePermission("recruitment.approvals.manage"), controller.update);

module.exports = router;
