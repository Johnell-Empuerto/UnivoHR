const express = require("express");
const router = express.Router();

const controller = require("../controllers/jobPosition.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/active",
  authenticate,
  requirePermission("recruitment.view"),
  controller.getAllActive,
);

router.get(
  "/",
  authenticate,
  requirePermission("recruitment.view"),
  controller.getAll,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("recruitment.view"),
  controller.getById,
);

router.post("/", authenticate, requirePermission("recruitment.jobs.manage"), controller.create);

router.put("/:id", authenticate, requirePermission("recruitment.jobs.manage"), controller.update);

router.delete(
  "/:id",
  authenticate,
  requirePermission("recruitment.jobs.manage"),
  controller.remove,
);

module.exports = router;
