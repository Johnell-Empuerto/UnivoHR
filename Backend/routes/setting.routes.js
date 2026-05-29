const express = require("express");
const router = express.Router();
const controller = require("../controllers/setting.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

const ADMIN_ONLY = [ROLES.SYSTEM_ADMIN];
router.get("/", authenticate, authorize(ADMIN_ONLY), controller.getAllSettings);
router.get("/:key", authenticate, authorize(ADMIN_ONLY), controller.getSetting);
router.put("/:key", authenticate, authorize(ADMIN_ONLY), controller.updateSetting);
router.post("/:key/toggle", authenticate, authorize(ADMIN_ONLY), controller.toggleSetting);

module.exports = router;
