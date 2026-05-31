const express = require("express");
const router = express.Router();

const controller = require("../controllers/forecast.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.post("/generate", authenticate, requirePermission("forecasting.manage"), controller.generateForecasts);
router.get("/history", authenticate, requirePermission("forecasting.view"), controller.getHistory);
router.get("/latest", authenticate, requirePermission("forecasting.view"), controller.getLatest);
router.get("/accuracy", authenticate, requirePermission("forecasting.view"), controller.getAccuracy);
router.patch("/:id/actual", authenticate, requirePermission("forecasting.manage"), controller.updateActual);

module.exports = router;
