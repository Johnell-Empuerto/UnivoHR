const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller");

router.post("/login", controller.login);
router.post("/verify-otp", controller.verifyOTP);
router.post("/resend-otp", controller.resendOTP);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

module.exports = router;
