const express = require("express");
const router = express.Router();
const controller = require("../controllers/emailTemplate.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// All email template routes require ADMIN or HR_ADMIN
router.get(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getAllTemplates,
);

router.get(
  "/:type",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getTemplateByType,
);

router.post(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.upsertTemplate,
);

router.put(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.updateTemplate,
);

router.patch(
  "/:id/toggle",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.toggleTemplate,
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.deleteTemplate,
);

module.exports = router;
