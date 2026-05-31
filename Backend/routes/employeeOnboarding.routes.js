const express = require("express");
const router = express.Router();

const controller = require("../controllers/employeeOnboarding.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/",
  authenticate,
  requirePermission("employees.view"),
  controller.getAll,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("employees.view"),
  controller.getById,
);

router.post(
  "/",
  authenticate,
  requirePermission("employees.view"),
  controller.create,
);

router.put(
  "/:id",
  authenticate,
  requirePermission("employees.view"),
  controller.update,
);

module.exports = router;
