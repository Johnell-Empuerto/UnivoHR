const express = require("express");
const router = express.Router();
const controller = require("../controllers/auditLog.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/", authenticate, requirePermission("audit_logs.view"), controller.getAuditLogs);

module.exports = router;
