const express = require("express");
const router = express.Router();

const controller = require("../controllers/hrPolicy.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/", authenticate, requirePermission("hr_policies.view"), controller.getAll);
router.get("/:id", authenticate, requirePermission("hr_policies.view"), controller.getById);
router.post("/", authenticate, requirePermission("hr_policies.manage"), controller.create);
router.put("/:id", authenticate, requirePermission("hr_policies.manage"), controller.update);
router.delete("/:id", authenticate, requirePermission("hr_policies.manage"), controller.remove);
router.patch("/:id/status", authenticate, requirePermission("hr_policies.manage"), controller.setActive);

module.exports = router;
