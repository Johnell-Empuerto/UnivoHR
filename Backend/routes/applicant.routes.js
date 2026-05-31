const express = require("express");
const router = express.Router();

const controller = require("../controllers/applicant.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.get("/", authenticate, requirePermission("recruitment.view"), controller.getAll);
router.get("/:id", authenticate, requirePermission("recruitment.view"), controller.getById);
router.post("/", authenticate, requirePermission("recruitment.applicants.manage"), controller.create);
router.put("/:id", authenticate, requirePermission("recruitment.applicants.manage"), controller.update);
router.delete("/:id", authenticate, requirePermission("recruitment.applicants.manage"), controller.remove);
router.patch("/:id/status", authenticate, requirePermission("recruitment.applicants.manage"), controller.updateStatus);
router.post("/:id/convert", authenticate, requirePermission("recruitment.applicants.manage"), controller.convertToEmployee);

module.exports = router;
