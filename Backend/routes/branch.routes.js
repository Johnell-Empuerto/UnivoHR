const express = require("express");
const router = express.Router();

const controller = require("../controllers/branch.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/", authenticate, requirePermission("branches.view"), controller.getAll);
router.get("/active", authenticate, requirePermission("branches.view"), controller.getActive);
router.get("/:id", authenticate, requirePermission("branches.manage"), controller.getById);
router.post("/", authenticate, requirePermission("branches.manage"), controller.create);
router.put("/:id", authenticate, requirePermission("branches.manage"), controller.update);
router.patch("/:id/status", authenticate, requirePermission("branches.manage"), controller.setActive);
router.delete("/:id", authenticate, requirePermission("branches.manage"), controller.remove);

module.exports = router;
