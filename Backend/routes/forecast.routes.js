const express = require("express");
const router = express.Router();

const controller = require("../controllers/forecast.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const ROLES = require("../constants/roles");
const ADMIN_HR = [ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR];

router.post("/generate", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.generateForecasts);
router.get("/history", authenticate, authorize(ADMIN_HR), controller.getHistory);
router.get("/latest", authenticate, authorize(ADMIN_HR), controller.getLatest);
router.get("/accuracy", authenticate, authorize(ADMIN_HR), controller.getAccuracy);
router.patch("/:id/actual", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.updateActual);

module.exports = router;
