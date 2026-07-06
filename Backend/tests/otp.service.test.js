jest.mock("../config/redis", () => ({
  setEx: jest.fn().mockResolvedValue("OK"),
  get: jest.fn(),
  del: jest.fn().mockResolvedValue(1),
  ttl: jest.fn(),
}));

jest.mock("../services/smtp.service", () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: "test-mid" }),
}));

jest.mock("../services/notificationDispatch.service", () => ({
  canSendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock("../utils/emailDesign", () => ({
  buildStandaloneTransactionalEmail: jest.fn().mockReturnValue("<html>"),
  buildLoginOtpBody: jest.fn().mockReturnValue("<body>"),
  buildPasswordResetOtpBody: jest.fn().mockReturnValue("<body>"),
}));

jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const redisClient = require("../config/redis");
const smtpService = require("../services/smtp.service");
const {
  generateOTP,
  storeOTP,
  getOTP,
  verifyOTP,
  deleteOTP,
  sendOTPEmail,
  resendOTP,
  maskEmail,
  getMaskedEmail,
  storePasswordResetOTP,
  verifyPasswordResetOTP,
  deletePasswordResetOTP,
  sendPasswordResetEmail,
} = require("../services/otp.service");

describe("otp.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    smtpService.sendEmail.mockResolvedValue({ messageId: "test-mid" });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("generateOTP", () => {
    it("returns a 6-digit string", () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });
  });

  describe("maskEmail", () => {
    it("masks email with 4+ char local part", () => {
      expect(maskEmail("john.doe@example.com")).toBe("jo***@example.com");
    });

    it("masks email with 2-3 char local part", () => {
      expect(maskEmail("ab@example.com")).toBe("a***@example.com");
    });

    it("masks email with 1 char local part", () => {
      expect(maskEmail("a@example.com")).toBe("a***@example.com");
    });

    it("returns fallback for null", () => {
      expect(maskEmail(null)).toBe("your email");
    });

    it("returns fallback for missing @", () => {
      expect(maskEmail("notanemail")).toBe("your email");
    });
  });

  describe("storeOTP", () => {
    const now = new Date("2026-07-06T12:00:00Z");

    beforeEach(() => {
      jest.setSystemTime(now);
    });

    it("stores OTP in Redis with default 300s TTL", async () => {
      redisClient.get.mockResolvedValue(null);

      await storeOTP(1, "test@example.com", "123456");

      expect(redisClient.setEx).toHaveBeenCalledWith(
        "otp:1",
        300,
        expect.any(String),
      );
      const stored = JSON.parse(redisClient.setEx.mock.calls[0][2]);
      expect(stored.otp).toBe("123456");
      expect(stored.email).toBe("test@example.com");
      expect(stored.attempts).toBe(0);
      expect(stored.purpose).toBe("login");
    });

    it("throws if last OTP was created less than 60s ago", async () => {
      const recent = new Date(now.getTime() - 30000).toISOString();
      redisClient.get.mockResolvedValue(
        JSON.stringify({ otp: "654321", created_at: recent }),
      );

      await expect(storeOTP(1, "test@example.com", "123456")).rejects.toThrow(
        "Please wait 60 seconds before requesting another OTP",
      );
    });

    it("allows new OTP if 60s have passed", async () => {
      const old = new Date(now.getTime() - 120000).toISOString();
      redisClient.get.mockResolvedValue(
        JSON.stringify({ otp: "654321", created_at: old }),
      );

      await storeOTP(1, "test@example.com", "123456");

      expect(redisClient.setEx).toHaveBeenCalled();
    });

    it("accepts custom expiration", async () => {
      redisClient.get.mockResolvedValue(null);

      await storeOTP(1, "test@example.com", "123456", 600);

      expect(redisClient.setEx).toHaveBeenCalledWith("otp:1", 600, expect.any(String));
    });
  });

  describe("storePasswordResetOTP", () => {
    const now = new Date("2026-07-06T12:00:00Z");

    beforeEach(() => {
      jest.setSystemTime(now);
    });

    it("stores with 180s TTL and password_reset purpose", async () => {
      redisClient.get.mockResolvedValue(null);

      await storePasswordResetOTP(1, "test@example.com", "123456");

      expect(redisClient.setEx).toHaveBeenCalledWith(
        "pwd_reset:1",
        180,
        expect.any(String),
      );
      const stored = JSON.parse(redisClient.setEx.mock.calls[0][2]);
      expect(stored.purpose).toBe("password_reset");
    });

    it("throws if last reset OTP was less than 60s ago", async () => {
      const recent = new Date(now.getTime() - 30000).toISOString();
      redisClient.get.mockResolvedValue(
        JSON.stringify({ otp: "654321", created_at: recent }),
      );

      await expect(
        storePasswordResetOTP(1, "test@example.com", "123456"),
      ).rejects.toThrow("Please wait 60 seconds before requesting another code");
    });
  });

  describe("getOTP", () => {
    it("returns parsed OTP data", async () => {
      redisClient.get.mockResolvedValue(
        JSON.stringify({ otp: "123456", email: "a@b.com" }),
      );

      const result = await getOTP(1);
      expect(result.otp).toBe("123456");
      expect(result.email).toBe("a@b.com");
    });

    it("returns null when no OTP stored", async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await getOTP(1);
      expect(result).toBeNull();
    });
  });

  describe("verifyOTP", () => {
    it("returns success for correct OTP and deletes it", async () => {
      redisClient.get.mockResolvedValue(
        JSON.stringify({ otp: "123456", attempts: 0 }),
      );
      redisClient.ttl.mockResolvedValue(200);

      const result = await verifyOTP(1, "123456");

      expect(result.success).toBe(true);
      expect(result.message).toBe("OTP verified successfully");
      expect(redisClient.del).toHaveBeenCalledWith("otp:1");
    });

    it("returns expired when no OTP stored", async () => {
      redisClient.get.mockResolvedValue(null);
      redisClient.ttl.mockResolvedValue(0);

      const result = await verifyOTP(1, "123456");

      expect(result.success).toBe(false);
      expect(result.message).toBe("OTP expired. Please request a new code.");
    });

    it("returns too many attempts after 5 failures and deletes", async () => {
      redisClient.get.mockResolvedValue(
        JSON.stringify({ otp: "123456", attempts: 5 }),
      );
      redisClient.ttl.mockResolvedValue(100);

      const result = await verifyOTP(1, "wrong");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Too many failed attempts. Please request a new OTP.");
      expect(redisClient.del).toHaveBeenCalledWith("otp:1");
    });

    it("increments attempts on wrong OTP and returns remaining count", async () => {
      redisClient.get.mockResolvedValue(
        JSON.stringify({ otp: "123456", attempts: 0 }),
      );
      redisClient.ttl.mockResolvedValue(200);

      const result = await verifyOTP(1, "wrong");

      expect(result.success).toBe(false);
      expect(result.message).toContain("4 attempt");
    });
  });

  describe("verifyPasswordResetOTP", () => {
    it("returns success for correct OTP", async () => {
      redisClient.get.mockResolvedValue(
        JSON.stringify({ otp: "123456", attempts: 0 }),
      );

      const result = await verifyPasswordResetOTP(1, "123456");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Code verified successfully");
    });

    it("returns expired when no OTP stored", async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await verifyPasswordResetOTP(1, "123456");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Reset code expired. Please request a new code.");
    });

    it("deletes after 5 failed attempts", async () => {
      redisClient.get.mockResolvedValue(
        JSON.stringify({ otp: "123456", attempts: 5 }),
      );

      const result = await verifyPasswordResetOTP(1, "wrong");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Too many failed attempts. Please request a new code.");
      expect(redisClient.del).toHaveBeenCalledWith("pwd_reset:1");
    });
  });

  describe("deleteOTP / deletePasswordResetOTP", () => {
    it("deletes OTP key", async () => {
      await deleteOTP(1);
      expect(redisClient.del).toHaveBeenCalledWith("otp:1");
    });

    it("deletes password reset OTP key", async () => {
      await deletePasswordResetOTP(1);
      expect(redisClient.del).toHaveBeenCalledWith("pwd_reset:1");
    });
  });

  describe("sendOTPEmail", () => {
    it("sends email via smtpService", async () => {
      const result = await sendOTPEmail("test@example.com", "123456", "John");

      expect(smtpService.sendEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.stringContaining("Login"),
        "<html>",
      );
      expect(result.messageId).toBe("test-mid");
    });

    it("sends even when login_otp email rule is disabled", async () => {
      const dispatch = require("../services/notificationDispatch.service");
      dispatch.canSendEmail.mockResolvedValueOnce(false);

      const result = await sendOTPEmail("test@example.com", "123456", "John");

      expect(result.messageId).toBe("test-mid");
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("sends password reset email", async () => {
      const result = await sendPasswordResetEmail("test@example.com", "123456", "John");

      expect(smtpService.sendEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.stringContaining("Password Reset"),
        "<html>",
      );
      expect(result.messageId).toBe("test-mid");
    });

    it("throws when email fails", async () => {
      smtpService.sendEmail.mockRejectedValueOnce(new Error("SMTP failed"));

      await expect(
        sendPasswordResetEmail("test@example.com", "123456", "John"),
      ).rejects.toThrow("Failed to send password reset email");
    });
  });

  describe("resendOTP", () => {
    it("generates, stores, and sends a new OTP", async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await resendOTP(1, "test@example.com", "John");

      expect(result.success).toBe(true);
      expect(redisClient.setEx).toHaveBeenCalled();
      expect(smtpService.sendEmail).toHaveBeenCalled();
    });
  });

  describe("getMaskedEmail", () => {
    it("returns masked email from stored OTP", async () => {
      redisClient.get.mockResolvedValue(
        JSON.stringify({ email: "john.doe@example.com" }),
      );

      const result = await getMaskedEmail(1);
      expect(result).toBe("jo***@example.com");
    });

    it("returns null when no OTP stored", async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await getMaskedEmail(1);
      expect(result).toBeNull();
    });
  });
});
