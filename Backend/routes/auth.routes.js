const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth.middleware");
const {
  loginLimiter,
  otpLimiter,
  resendOtpLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require("../middleware/rateLimit.middleware");

router.post("/login", loginLimiter, controller.login);

router.post("/verify-otp", otpLimiter, controller.verifyOTP);

router.post("/resend-otp", resendOtpLimiter, controller.resendOTP);

router.post("/forgot-password", forgotPasswordLimiter, controller.forgotPassword);

router.post("/reset-password", resetPasswordLimiter, controller.resetPassword);

router.post("/refresh", controller.refresh);

router.post("/logout", authenticate, controller.logout);

module.exports = router;
