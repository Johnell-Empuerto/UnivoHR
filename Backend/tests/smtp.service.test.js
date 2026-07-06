jest.mock("../models/smtp.model", () => ({
  getSmtpSettings: jest.fn(),
  getAllSmtpSettings: jest.fn(),
  getSmtpSettingsById: jest.fn(),
  createSmtpSettings: jest.fn(),
  updateSmtpSettings: jest.fn(),
  deleteSmtpSettings: jest.fn(),
  updateTestEmailStatus: jest.fn(),
}));

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(),
}));

jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));

const smtpModel = require("../models/smtp.model");
const nodemailer = require("nodemailer");
const {
  getSmtpSettings, getAllSmtpSettings, createSmtpSettings,
  updateSmtpSettings, deleteSmtpSettings, testSmtpConnection, sendEmail,
} = require("../services/smtp.service");

describe("smtp.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSmtpConfig = {
    id: 1, host: "smtp.test.com", port: 587,
    username: "user", password: "pass",
    from_email: "test@test.com", from_name: "Test",
    encryption: "tls", is_active: true,
  };

  describe("getSmtpSettings", () => {
    it("delegates", async () => {
      smtpModel.getSmtpSettings.mockResolvedValue(mockSmtpConfig);
      expect(await getSmtpSettings()).toEqual(mockSmtpConfig);
    });
  });

  describe("getAllSmtpSettings", () => {
    it("delegates", async () => {
      smtpModel.getAllSmtpSettings.mockResolvedValue([mockSmtpConfig]);
      expect(await getAllSmtpSettings()).toEqual([mockSmtpConfig]);
    });
  });

  describe("createSmtpSettings", () => {
    it("creates with valid data", async () => {
      smtpModel.createSmtpSettings.mockResolvedValue(mockSmtpConfig);
      const result = await createSmtpSettings(mockSmtpConfig);
      expect(result).toEqual(mockSmtpConfig);
    });

    it("throws when required fields missing", async () => {
      await expect(createSmtpSettings({})).rejects.toThrow("Host is required");
      await expect(createSmtpSettings({ host: "h" })).rejects.toThrow("Port is required");
      await expect(createSmtpSettings({ host: "h", port: 1 })).rejects.toThrow("Username is required");
    });
  });

  describe("updateSmtpSettings", () => {
    it("updates existing settings", async () => {
      smtpModel.getSmtpSettingsById.mockResolvedValue(mockSmtpConfig);
      smtpModel.updateSmtpSettings.mockResolvedValue({ ...mockSmtpConfig, host: "new.host" });

      const result = await updateSmtpSettings(1, { host: "new.host" });
      expect(result.host).toBe("new.host");
    });

    it("throws when not found", async () => {
      smtpModel.getSmtpSettingsById.mockResolvedValue(null);
      await expect(updateSmtpSettings(999, {})).rejects.toThrow("SMTP settings not found");
    });
  });

  describe("deleteSmtpSettings", () => {
    it("deletes inactive settings", async () => {
      smtpModel.getSmtpSettingsById.mockResolvedValue({ ...mockSmtpConfig, is_active: false });
      smtpModel.deleteSmtpSettings.mockResolvedValue({ id: 1 });

      expect(await deleteSmtpSettings(1)).toEqual({ id: 1 });
    });

    it("throws 409 for active settings", async () => {
      smtpModel.getSmtpSettingsById.mockResolvedValue(mockSmtpConfig);

      await expect(deleteSmtpSettings(1)).rejects.toMatchObject({
        message: expect.stringContaining("Cannot delete active SMTP configuration"),
        statusCode: 409,
      });
    });
  });

  describe("sendEmail", () => {
    it("sends email successfully", async () => {
      smtpModel.getSmtpSettings.mockResolvedValue(mockSmtpConfig);
      const mockTransporter = { sendMail: jest.fn().mockResolvedValue({ messageId: "mid" }) };
      nodemailer.createTransport.mockReturnValue(mockTransporter);

      const result = await sendEmail("to@test.com", "Subject", "<p>Body</p>");

      expect(result.messageId).toBe("mid");
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ host: "smtp.test.com", port: 587 }),
      );
    });

    it("throws when no SMTP configured", async () => {
      smtpModel.getSmtpSettings.mockResolvedValue(null);

      await expect(sendEmail("to@test.com", "Sub", "<p>B</p>")).rejects.toThrow("SMTP settings not configured");
    });

    it("throws when credentials missing", async () => {
      smtpModel.getSmtpSettings.mockResolvedValue({ ...mockSmtpConfig, username: "", password: "" });

      await expect(sendEmail("to@test.com", "Sub", "<p>B</p>")).rejects.toThrow("SMTP credentials missing");
    });

    it("handles send failure", async () => {
      smtpModel.getSmtpSettings.mockResolvedValue(mockSmtpConfig);
      const mockTransporter = { sendMail: jest.fn().mockRejectedValue(new Error("Connection refused")) };
      nodemailer.createTransport.mockReturnValue(mockTransporter);

      await expect(sendEmail("to@test.com", "Sub", "<p>B</p>")).rejects.toThrow("Email sending failed");
    });

    it("sets secure=true for SSL encryption", async () => {
      smtpModel.getSmtpSettings.mockResolvedValue({ ...mockSmtpConfig, encryption: "ssl" });
      const mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
      nodemailer.createTransport.mockReturnValue(mockTransporter);

      await sendEmail("to@test.com", "Sub", "<p>B</p>");

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true }),
      );
    });
  });

  describe("testSmtpConnection", () => {
    it("tests connection and sends test email", async () => {
      smtpModel.getSmtpSettingsById.mockResolvedValue(mockSmtpConfig);
      const mockTransporter = { verify: jest.fn().mockResolvedValue(true), sendMail: jest.fn().mockResolvedValue({ messageId: "mid" }) };
      nodemailer.createTransport.mockReturnValue(mockTransporter);

      const result = await testSmtpConnection(1, "test@test.com");

      expect(result.success).toBe(true);
      expect(smtpModel.updateTestEmailStatus).toHaveBeenCalledWith(1, true);
    });

    it("throws when SMTP not found", async () => {
      smtpModel.getSmtpSettingsById.mockResolvedValue(null);
      await expect(testSmtpConnection(999, "t@t.com")).rejects.toThrow("SMTP settings not found");
    });
  });
});
