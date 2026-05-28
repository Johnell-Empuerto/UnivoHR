const express = require("express");
const router = express.Router();

const controller = require("../controllers/applicantRequirement.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

router.get(
  "/:id/requirements",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.getByApplicantId,
);

router.post(
  "/:id/requirements",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.create,
);

router.patch(
  "/:id/requirements/:requirementId",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.update,
);

router.delete(
  "/:id/requirements/:requirementId",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.remove,
);

module.exports = router;
