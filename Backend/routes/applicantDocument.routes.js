const express = require("express");
const router = express.Router();

const controller = require("../controllers/applicantDocument.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/:applicantId",
  authenticate,
  requirePermission("recruitment.view"),
  controller.getByApplicantId,
);

router.post(
  "/:applicantId",
  authenticate,
  requirePermission("recruitment.applicants.manage"),
  controller.create,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("recruitment.applicants.manage"),
  controller.remove,
);

module.exports = router;
