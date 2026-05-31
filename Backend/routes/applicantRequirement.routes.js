const express = require("express");
const router = express.Router();

const controller = require("../controllers/applicantRequirement.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/:id/requirements",
  authenticate,
  requirePermission("recruitment.applicants.manage"),
  controller.getByApplicantId,
);

router.post(
  "/:id/requirements",
  authenticate,
  requirePermission("recruitment.applicants.manage"),
  controller.create,
);

router.patch(
  "/:id/requirements/:requirementId",
  authenticate,
  requirePermission("recruitment.applicants.manage"),
  controller.update,
);

router.delete(
  "/:id/requirements/:requirementId",
  authenticate,
  requirePermission("recruitment.applicants.manage"),
  controller.remove,
);

module.exports = router;
