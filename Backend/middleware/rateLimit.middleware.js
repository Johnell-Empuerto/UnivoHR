const rateLimit = require("express-rate-limit");

const WINDOW_MS =
  (Number(process.env.API_RATE_WINDOW_MINUTES) || 15) * 60 * 1000;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP attempts. Please try again later.",
  },
});

const resendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP resend requests. Please try again later.",
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many reset attempts. Please try again later.",
  },
});

const deviceLogLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many device log requests. Please try again later.",
  },
});

const readOnlyLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Number(process.env.API_READ_LIMIT) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please wait and try again.",
  },
});

const writeLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Number(process.env.API_WRITE_LIMIT) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please wait and try again.",
  },
});

module.exports = {
  loginLimiter,
  otpLimiter,
  resendOtpLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  deviceLogLimiter,
  readOnlyLimiter,
  writeLimiter,
};
