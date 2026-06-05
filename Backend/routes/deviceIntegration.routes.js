const express = require("express");
const router = express.Router();
const controller = require("../controllers/deviceIntegration.controller");
const requirePermission = require("../middleware/permission.middleware");
const upload = require("../middleware/upload.middleware");

// ─── DEVICES ──────────────────────────────────────────────
router.get("/devices",       requirePermission("devices.view"),   controller.getDevices);
router.get("/devices/:id",   requirePermission("devices.view"),   controller.getDevice);
router.post("/devices",      requirePermission("devices.manage"), controller.createDevice);
router.put("/devices/:id",   requirePermission("devices.manage"), controller.updateDevice);
router.delete("/devices/:id", requirePermission("devices.manage"), controller.deleteDevice);

// ─── DEVICE LOG MAPPINGS ─────────────────────────────────
router.get("/mappings",       requirePermission("devices.view"),   controller.getMappings);
router.post("/mappings",      requirePermission("devices.manage"), controller.createMapping);
router.put("/mappings/:id",   requirePermission("devices.manage"), controller.updateMapping);
router.delete("/mappings/:id", requirePermission("devices.manage"), controller.deleteMapping);

// ─── EMPLOYEE DEVICE USERS ───────────────────────────────
router.get("/device-users",       requirePermission("devices.view"),   controller.getEmployeeDeviceUsers);
router.get("/device-users/:id",   requirePermission("devices.view"),   controller.getEmployeeDeviceUser);
router.post("/device-users",      requirePermission("devices.manage"), controller.createEmployeeDeviceUser);
router.put("/device-users/:id",   requirePermission("devices.manage"), controller.updateEmployeeDeviceUser);
router.delete("/device-users/:id", requirePermission("devices.manage"), controller.deleteEmployeeDeviceUser);

// ─── RAW LOGS ────────────────────────────────────────────
router.get("/logs",     requirePermission("device_logs.view"),   controller.getRawLogs);
router.get("/logs/:id", requirePermission("device_logs.view"),   controller.getRawLog);

// ─── IMPORT ──────────────────────────────────────────────
router.post("/import", requirePermission("device_logs.manage"), upload.single("file"), controller.importLogs);

// ─── PROCESSING ──────────────────────────────────────────
router.post("/logs/:id/process", requirePermission("device_logs.manage"), controller.processLog);
router.post("/logs/process-batch", requirePermission("device_logs.manage"), controller.processBatch);

// ─── GENERIC PUSH ENDPOINT ───────────────────────────────
router.post("/push/:deviceId", controller.pushLog);

module.exports = router;
