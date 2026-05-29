const express = require("express");
const router = express.Router();

const controller = require("../controllers/applicant.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

const HR_ACCESS = [ROLES.ADMIN, ROLES.HR_USER];
const ADMIN_ONLY = [ROLES.ADMIN];

router.get("/", authenticate, authorize(HR_ACCESS), controller.getAll);
router.get("/:id", authenticate, authorize(HR_ACCESS), controller.getById);
router.post("/", authenticate, authorize(HR_ACCESS), controller.create);
router.put("/:id", authenticate, authorize(HR_ACCESS), controller.update);
router.delete("/:id", authenticate, authorize(ADMIN_ONLY), controller.remove);
router.patch("/:id/status", authenticate, authorize(HR_ACCESS), controller.updateStatus);
router.post("/:id/convert", authenticate, authorize(ADMIN_ONLY), controller.convertToEmployee);

module.exports = router;
