const express = require("express");
const router = express.Router();
const controller = require("../controllers/emailTemplate.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/",
  authenticate,
  requirePermission("settings.email_templates"),
  controller.getAllTemplates,
);

router.get(
  "/:type",
  authenticate,
  requirePermission("settings.email_templates"),
  controller.getTemplateByType,
);

router.post(
  "/",
  authenticate,
  requirePermission("settings.email_templates"),
  controller.upsertTemplate,
);

router.put(
  "/:id",
  authenticate,
  requirePermission("settings.email_templates"),
  controller.updateTemplate,
);

router.patch(
  "/:id/toggle",
  authenticate,
  requirePermission("settings.email_templates"),
  controller.toggleTemplate,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("settings.email_templates"),
  controller.deleteTemplate,
);

module.exports = router;