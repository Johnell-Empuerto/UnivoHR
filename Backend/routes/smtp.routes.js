const express = require("express");
const router = express.Router();

const controller = require("../controllers/smtp.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/",
  authenticate,
  requirePermission("settings.smtp"),
  controller.getSmtpSettings,
);

router.get(
  "/all",
  authenticate,
  requirePermission("settings.smtp"),
  controller.getAllSmtpSettings,
);

router.post(
  "/",
  authenticate,
  requirePermission("settings.smtp"),
  controller.createSmtpSettings,
);

router.put(
  "/:id",
  authenticate,
  requirePermission("settings.smtp"),
  controller.updateSmtpSettings,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("settings.smtp"),
  controller.deleteSmtpSettings,
);

router.post(
  "/test",
  authenticate,
  requirePermission("settings.smtp"),
  controller.testSmtpConnection,
);

module.exports = router;