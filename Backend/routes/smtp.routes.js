const express = require("express");
const router = express.Router();

const controller = require("../controllers/smtp.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// All SMTP routes require SYSTEM_ADMIN only (technical settings)
router.get(
  "/",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.getSmtpSettings,
);

router.get(
  "/all",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.getAllSmtpSettings,
);

router.post(
  "/",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.createSmtpSettings,
);

router.put(
  "/:id",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.updateSmtpSettings,
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.deleteSmtpSettings,
);

router.post(
  "/test",
  authenticate,
  authorize([ROLES.SYSTEM_ADMIN]),
  controller.testSmtpConnection,
);

module.exports = router;
