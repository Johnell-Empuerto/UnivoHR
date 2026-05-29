const express = require("express");
const router = express.Router();

const controller = require("../controllers/jobPosition.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

router.get(
  "/active",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_USER]),
  controller.getAllActive,
);

router.get(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_USER]),
  controller.getAll,
);

router.get(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_USER]),
  controller.getById,
);

router.post(
  "/",
  authenticate,
  authorize([ROLES.ADMIN]),
  controller.create,
);

router.put(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN]),
  controller.update,
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN]),
  controller.remove,
);

module.exports = router;
