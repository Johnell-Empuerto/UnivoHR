const express = require("express");
const router = express.Router();

const controller = require("../controllers/forecast.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const { ROLES } = require("../constants/roles");
const HR_ACCESS = [ROLES.ADMIN, ROLES.HR_USER];
const ADMIN_ONLY = [ROLES.ADMIN];

router.post("/generate", authenticate, authorize(ADMIN_ONLY), controller.generateForecasts);
router.get("/history", authenticate, authorize(HR_ACCESS), controller.getHistory);
router.get("/latest", authenticate, authorize(HR_ACCESS), controller.getLatest);
router.get("/accuracy", authenticate, authorize(HR_ACCESS), controller.getAccuracy);
router.patch("/:id/actual", authenticate, authorize(ADMIN_ONLY), controller.updateActual);

module.exports = router;
