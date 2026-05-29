const express = require("express");
const router = express.Router();

const controller = require("../controllers/employeeRequirement.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

router.get(
  "/:onboardingId",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_USER]),
  controller.getByOnboardingId,
);

router.post(
  "/:onboardingId",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_USER]),
  controller.create,
);

router.put(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_USER]),
  controller.update,
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN]),
  controller.remove,
);

module.exports = router;
