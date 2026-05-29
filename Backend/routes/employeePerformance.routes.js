const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeePerformance.controller");
const authenticate = require("../middleware/auth.middleware");

router.get("/summary", authenticate, controller.getSummary);
router.get("/probation", authenticate, controller.getProbationInfo);

module.exports = router;
