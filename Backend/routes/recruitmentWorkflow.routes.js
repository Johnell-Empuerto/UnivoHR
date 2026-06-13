const express = require("express");
const router = express.Router();

const controller = require("../controllers/recruitmentWorkflow.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/",
  authenticate,
  requirePermission("recruitment.workflows.manage"),
  controller.getAll,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("recruitment.workflows.manage"),
  controller.getById,
);

router.post(
  "/",
  authenticate,
  requirePermission("recruitment.workflows.manage"),
  controller.create,
);

router.put(
  "/:id",
  authenticate,
  requirePermission("recruitment.workflows.manage"),
  controller.update,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("recruitment.workflows.manage"),
  controller.remove,
);

router.get(
  "/:id/stages",
  authenticate,
  requirePermission("recruitment.workflows.manage"),
  controller.getStages,
);

router.post(
  "/:id/stages",
  authenticate,
  requirePermission("recruitment.workflows.manage"),
  controller.createStage,
);

router.put(
  "/stages/:stageId",
  authenticate,
  requirePermission("recruitment.workflows.manage"),
  controller.updateStage,
);

router.delete(
  "/stages/:stageId",
  authenticate,
  requirePermission("recruitment.workflows.manage"),
  controller.deleteStage,
);

router.post(
  "/:id/stages/reorder",
  authenticate,
  requirePermission("recruitment.workflows.manage"),
  controller.reorderStages,
);

module.exports = router;
