const express = require("express");
const router = express.Router();
const controller = require("../controllers/setting.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/employee-code/next", authenticate, requirePermission("settings.view"), controller.getNextEmployeeCode);
router.get("/", authenticate, requirePermission("settings.view"), controller.getAllSettings);
router.get("/:key", authenticate, requirePermission("settings.view"), controller.getSetting);
router.put("/:key", authenticate, requirePermission("settings.view"), controller.updateSetting);
router.post("/:key/toggle", authenticate, requirePermission("settings.view"), controller.toggleSetting);

module.exports = router;