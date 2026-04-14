const express = require("express");
const router = express.Router();
const controller = require("../controllers/setting.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// All setting routes require ADMIN or HR_ADMIN
router.get(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getAllSettings,
);

router.get(
  "/:key",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.getSetting,
);

router.put(
  "/:key",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.updateSetting,
);

router.post(
  "/:key/toggle",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.toggleSetting,
);

module.exports = router;
