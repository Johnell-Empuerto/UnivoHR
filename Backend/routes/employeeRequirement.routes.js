const express = require("express");
const router = express.Router();

const controller = require("../controllers/employeeRequirement.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/:onboardingId",
  authenticate,
  requirePermission("employees.view"),
  controller.getByOnboardingId,
);

router.post(
  "/:onboardingId",
  authenticate,
  requirePermission("employees.view"),
  controller.create,
);

router.put(
  "/:id",
  authenticate,
  requirePermission("employees.view"),
  controller.update,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("employees.view"),
  controller.remove,
);

module.exports = router;
