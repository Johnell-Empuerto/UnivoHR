const express = require("express");
const router = express.Router();
const controller = require("../controllers/emailTemplate.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// All email template routes require SYSTEM_ADMIN only (technical settings)
router.get(
  "/",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.getAllTemplates,
);

router.get(
  "/:type",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.getTemplateByType,
);

router.post(
  "/",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.upsertTemplate,
);

router.put(
  "/:id",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.updateTemplate,
);

router.patch(
  "/:id/toggle",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.toggleTemplate,
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.deleteTemplate,
);

module.exports = router;
