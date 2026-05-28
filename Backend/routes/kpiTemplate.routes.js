const express = require("express");
const router = express.Router();
const controller = require("../controllers/kpiTemplate.controller");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");
const authenticate = require("../middleware/auth.middleware");

router.get("/active", authenticate, controller.getActiveTemplates);
router.get("/", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.getAll);
router.get("/:id", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.getById);
router.post("/", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.create);
router.put("/:id", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.update);
router.patch("/:id/toggle", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.toggleActive);
router.delete("/:id", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.remove);

router.get("/:templateId/items", authenticate, controller.getItems);
router.post("/:templateId/items", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.addItem);
router.put("/items/:itemId", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.editItem);
router.delete("/items/:itemId", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.removeItem);

module.exports = router;
