const express = require("express");
const router = express.Router();

const controller = require("../controllers/applicantInterview.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get(
  "/:applicantId",
  authenticate,
  requirePermission("recruitment.interviews.manage"),
  controller.getByApplicantId,
);

router.post(
  "/:applicantId",
  authenticate,
  requirePermission("recruitment.interviews.manage"),
  controller.create,
);

router.put(
  "/:id",
  authenticate,
  requirePermission("recruitment.interviews.manage"),
  controller.update,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("recruitment.interviews.manage"),
  controller.remove,
);

module.exports = router;
