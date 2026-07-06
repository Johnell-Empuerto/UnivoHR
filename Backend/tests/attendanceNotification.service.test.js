jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));
jest.mock("../services/smtp.service", () => ({ sendEmail: jest.fn() }));
jest.mock("../services/notificationDispatch.service", () => ({ canSendEmail: jest.fn() }));
jest.mock("../services/notificationRule.service", () => ({ getRuleByKey: jest.fn() }));
jest.mock("../services/emailTemplate.service", () => ({ renderEmail: jest.fn() }));

const pool = require("../config/db");
const smtpService = require("../services/smtp.service");
const notificationDispatch = require("../services/notificationDispatch.service");
const notificationRuleService = require("../services/notificationRule.service");
const emailTemplateService = require("../services/emailTemplate.service");
const {
  sendLateNoticeEmail,
  sendAbsentWithoutLeaveEmail,
  checkAndSendLateNotices,
  checkAndSendAbsentWithoutLeaveNotices,
} = require("../services/attendanceNotification.service");

describe("attendanceNotification.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("sendLateNoticeEmail", () => {
    it("skips when notification is disabled", async () => {
      notificationDispatch.canSendEmail.mockResolvedValue(false);
      await sendLateNoticeEmail(1, 3, ["2026-01-01"]);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("skips when employee has no email", async () => {
      notificationDispatch.canSendEmail.mockResolvedValue(true);
      pool.query.mockResolvedValueOnce({ rows: [{ email: null }] });
      await sendLateNoticeEmail(1, 3, ["2026-01-01"]);
      expect(smtpService.sendEmail).not.toHaveBeenCalled();
    });

    it("sends late notice email successfully", async () => {
      notificationDispatch.canSendEmail.mockResolvedValue(true);
      pool.query.mockResolvedValueOnce({ rows: [{ email: "emp@test.com", first_name: "John", last_name: "Doe" }] });
      emailTemplateService.renderEmail.mockResolvedValue({ subject: "Late Notice", html: "<p>Late</p>" });
      pool.query.mockResolvedValueOnce({ rows: [] });

      await sendLateNoticeEmail(1, 3, ["2026-01-01"]);

      expect(smtpService.sendEmail).toHaveBeenCalledWith("emp@test.com", "Late Notice", "<p>Late</p>");
      expect(pool.query).toHaveBeenLastCalledWith(
        expect.stringContaining("email_logs"), [1, "LATE_NOTICE"],
      );
    });

    it("logs failure on error", async () => {
      notificationDispatch.canSendEmail.mockResolvedValue(true);
      pool.query.mockRejectedValueOnce(new Error("DB error"));
      await expect(sendLateNoticeEmail(1, 3, ["2026-01-01"])).resolves.toBeUndefined();
      expect(pool.query).toHaveBeenLastCalledWith(
        expect.stringContaining("FAILED"), [1, "LATE_NOTICE", "DB error"],
      );
    });
  });

  describe("sendAbsentWithoutLeaveEmail", () => {
    it("skips when notification is disabled", async () => {
      notificationDispatch.canSendEmail.mockResolvedValue(false);
      await sendAbsentWithoutLeaveEmail(1, "2026-01-01");
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("sends absent email successfully", async () => {
      notificationDispatch.canSendEmail.mockResolvedValue(true);
      pool.query.mockResolvedValueOnce({ rows: [{ email: "emp@test.com", first_name: "John", last_name: "Doe" }] });
      emailTemplateService.renderEmail.mockResolvedValue({ subject: "Absent", html: "<p>Absent</p>" });
      pool.query.mockResolvedValueOnce({ rows: [] });

      await sendAbsentWithoutLeaveEmail(1, "2026-01-01");

      expect(smtpService.sendEmail).toHaveBeenCalledWith("emp@test.com", "Absent", "<p>Absent</p>");
    });
  });

  describe("checkAndSendLateNotices", () => {
    it("skips when rule is disabled", async () => {
      notificationRuleService.getRuleByKey.mockResolvedValue({ is_enabled: false });
      const result = await checkAndSendLateNotices();
      expect(result.skipped).toBe(true);
    });

    it("checks and sends late notices", async () => {
      notificationRuleService.getRuleByKey.mockResolvedValue({
        is_enabled: true, email_enabled: true, threshold_count: 3, threshold_days: 7,
      });
      const lateEmployee = { employee_id: 1, late_count: "3", late_dates: ["2026-01-01"] };
      pool.query.mockResolvedValueOnce({ rows: [lateEmployee] });
      pool.query.mockResolvedValueOnce({ rows: [] });

      notificationDispatch.canSendEmail.mockResolvedValue(true);
      pool.query.mockResolvedValueOnce({ rows: [{ email: "emp@test.com", first_name: "J", last_name: "D" }] });
      emailTemplateService.renderEmail.mockResolvedValue({ subject: "Late", html: "<p>Late</p>" });
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await checkAndSendLateNotices();
      expect(result.success).toBe(true);
    });

    it("handles errors gracefully", async () => {
      notificationRuleService.getRuleByKey.mockRejectedValue(new Error("Fail"));
      const result = await checkAndSendLateNotices();
      expect(result.success).toBe(false);
      expect(result.error).toBe("Fail");
    });
  });

  describe("checkAndSendAbsentWithoutLeaveNotices", () => {
    it("skips when rule is disabled", async () => {
      notificationRuleService.getRuleByKey.mockResolvedValue({ is_enabled: false });
      const result = await checkAndSendAbsentWithoutLeaveNotices();
      expect(result.skipped).toBe(true);
    });

    it("skips when email is disabled", async () => {
      notificationRuleService.getRuleByKey.mockResolvedValue({ is_enabled: true, email_enabled: false });
      const result = await checkAndSendAbsentWithoutLeaveNotices();
      expect(result.skipped).toBe(true);
    });

    it("checks and sends absent notices", async () => {
      notificationRuleService.getRuleByKey.mockResolvedValue({ is_enabled: true, email_enabled: true });
      pool.query.mockResolvedValueOnce({ rows: [{ employee_id: 1, absent_date: "2026-01-01" }] });
      pool.query.mockResolvedValueOnce({ rows: [] });

      notificationDispatch.canSendEmail.mockResolvedValue(true);
      pool.query.mockResolvedValueOnce({ rows: [{ email: "emp@test.com", first_name: "J", last_name: "D" }] });
      emailTemplateService.renderEmail.mockResolvedValue({ subject: "Absent", html: "<p>Absent</p>" });
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await checkAndSendAbsentWithoutLeaveNotices();
      expect(result.success).toBe(true);
    });
  });
});
