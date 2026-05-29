const express = require("express");
const router = express.Router();
const controller = require("../controllers/kpiTemplate.controller");
const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");
const authenticate = require("../middleware/auth.middleware");

const ADMIN_ONLY = [ROLES.ADMIN, ROLES.HR_USER];

router.get("/active", authenticate, controller.getActiveTemplates);
router.get("/", authenticate, authorize(ADMIN_ONLY), controller.getAll);
router.get("/:id", authenticate, authorize(ADMIN_ONLY), controller.getById);
router.post("/", authenticate, authorize(ADMIN_ONLY), controller.create);
router.put("/:id", authenticate, authorize(ADMIN_ONLY), controller.update);
router.patch("/:id/toggle", authenticate, authorize(ADMIN_ONLY), controller.toggleActive);
router.delete("/:id", authenticate, authorize(ADMIN_ONLY), controller.remove);
router.get("/:templateId/items", authenticate, controller.getItems);
router.post("/:templateId/items", authenticate, authorize(ADMIN_ONLY), controller.addItem);
router.put("/items/:itemId", authenticate, authorize(ADMIN_ONLY), controller.editItem);
router.delete("/items/:itemId", authenticate, authorize(ADMIN_ONLY), controller.removeItem);

module.exports = router;
