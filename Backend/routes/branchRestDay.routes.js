const express = require("express");
const router = express.Router();

const controller = require("../controllers/branchRestDay.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/", authenticate, requirePermission("branches.view"), controller.getAll);
router.get("/:branchId", authenticate, requirePermission("branches.view"), controller.getByBranch);
router.post("/:branchId", authenticate, requirePermission("branches.manage"), controller.create);
router.delete("/:id", authenticate, requirePermission("branches.manage"), controller.remove);
router.patch("/:id/status", authenticate, requirePermission("branches.manage"), controller.setActive);

module.exports = router;
