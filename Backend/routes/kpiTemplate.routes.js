const express = require("express");
const router = express.Router();
const controller = require("../controllers/kpiTemplate.controller");
const requirePermission = require("../middleware/permission.middleware");
const authenticate = require("../middleware/auth.middleware");

router.get("/active", authenticate, controller.getActiveTemplates);
router.get("/", authenticate, requirePermission("performance.templates.manage"), controller.getAll);
router.get("/:id", authenticate, requirePermission("performance.templates.manage"), controller.getById);
router.post("/", authenticate, requirePermission("performance.templates.manage"), controller.create);
router.put("/:id", authenticate, requirePermission("performance.templates.manage"), controller.update);
router.patch("/:id/toggle", authenticate, requirePermission("performance.templates.manage"), controller.toggleActive);
router.delete("/:id", authenticate, requirePermission("performance.templates.manage"), controller.remove);
router.get("/:templateId/items", authenticate, controller.getItems);
router.post("/:templateId/items", authenticate, requirePermission("performance.templates.manage"), controller.addItem);
router.put("/items/:itemId", authenticate, requirePermission("performance.templates.manage"), controller.editItem);
router.delete("/items/:itemId", authenticate, requirePermission("performance.templates.manage"), controller.removeItem);

module.exports = router;
