const express = require("express");
const router = express.Router();

const controller = require("../controllers/smtp.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// All SMTP routes require ADMIN or HR_ADMIN
router.get(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getSmtpSettings,
);

router.get(
  "/all",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getAllSmtpSettings,
);

router.post(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.createSmtpSettings,
);

router.put(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.updateSmtpSettings,
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.deleteSmtpSettings,
);

router.post(
  "/test",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.testSmtpConnection,
);

module.exports = router;
