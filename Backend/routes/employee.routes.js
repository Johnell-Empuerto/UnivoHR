const express = require("express");
const router = express.Router();

const controller = require("../controllers/employee.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");

// CREATE
router.post(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.createEmployee,
);

// GET ALL ( WITH FILTERS)
router.get(
  "/",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR]),
  controller.getEmployees,
);

// UPDATE
router.put(
  "/:id",
  authenticate,
  authorize([ROLES.ADMIN, ROLES.HR_ADMIN]),
  controller.updateEmployee,
);

module.exports = router;
