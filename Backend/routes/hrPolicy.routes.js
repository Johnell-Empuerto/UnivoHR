const express = require("express");
const router = express.Router();

const controller = require("../controllers/hrPolicy.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

const ALL = [ROLES.ADMIN, ROLES.HR_USER, ROLES.PAYROLL_USER, ROLES.EMPLOYEE];
const ADMIN_ONLY = [ROLES.ADMIN];

router.get("/", authenticate, authorize(ALL), controller.getAll);
router.get("/:id", authenticate, authorize(ALL), controller.getById);
router.post("/", authenticate, authorize(ADMIN_ONLY), controller.create);
router.put("/:id", authenticate, authorize(ADMIN_ONLY), controller.update);
router.delete("/:id", authenticate, authorize(ADMIN_ONLY), controller.remove);
router.patch("/:id/status", authenticate, authorize(ADMIN_ONLY), controller.setActive);

module.exports = router;
