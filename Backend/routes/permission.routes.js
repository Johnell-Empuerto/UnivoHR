const express = require("express");
const router = express.Router();
const controller = require("../controllers/permission.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.use(authenticate);

router.get("/", controller.getAllPermissions);
router.get("/:id", controller.getUserPermissions);
router.put("/:id", requirePermission("users.manage"), controller.setUserPermissions);
router.post("/:id/reset", controller.resetUserPermissions);

module.exports = router;
