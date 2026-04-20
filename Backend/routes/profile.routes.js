const express = require("express");
const router = express.Router();
const controller = require("../controllers/profile.controller");
const authenticate = require("../middleware/auth.middleware");

// All profile routes require authentication
router.use(authenticate);

// GET current user's profile only
router.get("/", controller.getProfile);

// UPDATE route removed - no editing allowed

module.exports = router;
