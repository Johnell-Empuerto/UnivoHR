const express = require("express");
const router = express.Router();

const controller = require("../controllers/statisticalAnomaly.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const { ROLES } = require("../constants/roles");

router.post("/scan/daily", authenticate, authorize([ROLES.ADMIN]), controller.runDailyScan);
router.post("/scan/weekly", authenticate, authorize([ROLES.ADMIN]), controller.runWeeklyScan);

module.exports = router;
