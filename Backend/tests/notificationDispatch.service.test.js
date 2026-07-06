jest.mock("../services/notificationRule.service", () => ({
  canSendInApp: jest.fn(),
  canSendEmail: jest.fn(),
}));

jest.mock("../utils/logger", () => ({ info: jest.fn() }));

const notificationRuleService = require("../services/notificationRule.service");
const logger = require("../utils/logger");
const {
  canSendInApp, canSendEmail, sendInAppIfEnabled, sendEmailIfEnabled,
} = require("../services/notificationDispatch.service");

describe("notificationDispatch.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("canSendInApp", () => {
    it("delegates to rule service", async () => {
      notificationRuleService.canSendInApp.mockResolvedValue(true);
      expect(await canSendInApp("leave_applied")).toBe(true);
    });
  });

  describe("canSendEmail", () => {
    it("delegates to rule service", async () => {
      notificationRuleService.canSendEmail.mockResolvedValue(false);
      expect(await canSendEmail("leave_applied")).toBe(false);
    });
  });

  describe("sendInAppIfEnabled", () => {
    it("calls notifyFn when enabled", async () => {
      notificationRuleService.canSendInApp.mockResolvedValue(true);
      const notifyFn = jest.fn().mockResolvedValue({ id: 1 });

      const result = await sendInAppIfEnabled("leave_applied", notifyFn);
      expect(result).toEqual({ id: 1 });
      expect(notifyFn).toHaveBeenCalled();
    });

    it("returns null and logs when disabled", async () => {
      notificationRuleService.canSendInApp.mockResolvedValue(false);
      const notifyFn = jest.fn();

      const result = await sendInAppIfEnabled("leave_applied", notifyFn);
      expect(result).toBeNull();
      expect(notifyFn).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe("sendEmailIfEnabled", () => {
    it("calls emailFn when enabled", async () => {
      notificationRuleService.canSendEmail.mockResolvedValue(true);
      const emailFn = jest.fn().mockResolvedValue({ messageId: "mid" });

      const result = await sendEmailIfEnabled("leave_applied", emailFn);
      expect(result).toEqual({ messageId: "mid" });
    });

    it("returns null when disabled", async () => {
      notificationRuleService.canSendEmail.mockResolvedValue(false);
      const result = await sendEmailIfEnabled("leave_applied", jest.fn());
      expect(result).toBeNull();
    });
  });
});
