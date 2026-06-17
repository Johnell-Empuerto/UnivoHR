const express = require("express");
const router = express.Router();
const controller = require("../controllers/notificationRule.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/", authenticate, requirePermission("settings.notifications"), controller.getAll);
router.get("/module/:module", authenticate, requirePermission("settings.notifications"), controller.getByModule);
router.get("/:ruleKey", authenticate, requirePermission("settings.notifications"), controller.getByKey);
router.put("/:ruleKey", authenticate, requirePermission("settings.notifications"), controller.update);
router.patch("/:ruleKey/toggle", authenticate, requirePermission("settings.notifications"), controller.toggle);

module.exports = router;
