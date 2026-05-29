const express = require("express");
const router = express.Router();

const controller = require("../controllers/branch.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

const HR_ACCESS = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER];
const ADMIN_ONLY = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN];

router.get("/", authenticate, authorize(HR_ACCESS), controller.getAll);
router.get("/active", authenticate, authorize(HR_ACCESS), controller.getActive);
router.get("/:id", authenticate, authorize(ADMIN_ONLY), controller.getById);
router.post("/", authenticate, authorize(ADMIN_ONLY), controller.create);
router.put("/:id", authenticate, authorize(ADMIN_ONLY), controller.update);
router.patch("/:id/status", authenticate, authorize(ADMIN_ONLY), controller.setActive);

module.exports = router;
