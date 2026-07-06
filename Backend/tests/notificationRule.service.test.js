jest.mock("../config/db", () => ({ query: jest.fn() }));

const pool = require("../config/db");
const {
  getAllRules, getRuleByKey, getRulesByModule,
  updateRule, toggleRule, isRuleEnabled, canSendInApp, canSendEmail, getThresholds,
} = require("../services/notificationRule.service");

describe("notificationRule.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRule = {
    id: 1, rule_key: "leave_applied", module: "leave",
    is_enabled: true, in_app_enabled: true, email_enabled: false,
    threshold_count: null,
  };

  describe("getAllRules", () => {
    it("returns all rules", async () => {
      pool.query.mockResolvedValue({ rows: [mockRule] });
      expect(await getAllRules()).toEqual([mockRule]);
    });
  });

  describe("getRuleByKey", () => {
    it("returns rule when found", async () => {
      pool.query.mockResolvedValue({ rows: [mockRule] });
      expect(await getRuleByKey("leave_applied")).toEqual(mockRule);
    });

    it("returns null when not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await getRuleByKey("nonexistent")).toBeNull();
    });
  });

  describe("getRulesByModule", () => {
    it("returns rules filtered by module", async () => {
      pool.query.mockResolvedValue({ rows: [mockRule] });
      const result = await getRulesByModule("leave");
      expect(result).toEqual([mockRule]);
      expect(pool.query.mock.calls[0][1]).toEqual(["leave"]);
    });
  });

  describe("updateRule", () => {
    it("updates allowed fields", async () => {
      pool.query.mockResolvedValue({ rows: [{ ...mockRule, email_enabled: true }] });

      const result = await updateRule("leave_applied", { email_enabled: true });
      expect(result.email_enabled).toBe(true);
    });

    it("ignores disallowed fields", async () => {
      pool.query.mockResolvedValue({ rows: [mockRule] });

      const result = await updateRule("leave_applied", { malicious_field: "x" });
      expect(result).toEqual(mockRule);
      // query should have been called with no SET clauses for disallowed fields
      expect(pool.query.mock.calls[0][1]).toEqual(["leave_applied"]);
    });

    it("returns rule unchanged when no valid fields provided", async () => {
      pool.query.mockResolvedValue({ rows: [mockRule] });

      const result = await updateRule("leave_applied", {});
      expect(result).toEqual(mockRule);
    });
  });

  describe("toggleRule", () => {
    it("toggles is_enabled by default", async () => {
      pool.query.mockResolvedValue({ rows: [{ ...mockRule, is_enabled: false }] });

      const result = await toggleRule("leave_applied");
      expect(result.is_enabled).toBe(false);
      expect(pool.query.mock.calls[0][0]).toContain("NOT is_enabled");
    });

    it("toggles specified field", async () => {
      pool.query.mockResolvedValue({ rows: [{ ...mockRule, email_enabled: true }] });

      const result = await toggleRule("leave_applied", "email_enabled");
      expect(result.email_enabled).toBe(true);
    });

    it("throws for disallowed field", async () => {
      await expect(toggleRule("leave_applied", "password")).rejects.toThrow("Cannot toggle field");
    });

    it("returns null when rule not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await toggleRule("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("isRuleEnabled", () => {
    it("returns enabled status from rule", async () => {
      pool.query.mockResolvedValue({ rows: [mockRule] });
      expect(await isRuleEnabled("leave_applied")).toBe(true);
    });

    it("returns default true when rule not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await isRuleEnabled("nonexistent")).toBe(true);
    });
  });

  describe("canSendInApp", () => {
    it("returns true when rule has both enabled flags", async () => {
      pool.query.mockResolvedValue({ rows: [mockRule] });
      expect(await canSendInApp("leave_applied")).toBe(true);
    });

    it("returns false when rule is disabled", async () => {
      pool.query.mockResolvedValue({ rows: [{ ...mockRule, is_enabled: false }] });
      expect(await canSendInApp("leave_applied")).toBe(false);
    });

    it("returns false when in_app is disabled", async () => {
      pool.query.mockResolvedValue({ rows: [{ ...mockRule, in_app_enabled: false }] });
      expect(await canSendInApp("leave_applied")).toBe(false);
    });

    it("returns default true when no rule found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await canSendInApp("unknown")).toBe(true);
    });
  });

  describe("canSendEmail", () => {
    it("returns false by default when no rule found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await canSendEmail("unknown")).toBe(false);
    });

    it("returns true when rule has both flags", async () => {
      pool.query.mockResolvedValue({ rows: [{ ...mockRule, email_enabled: true }] });
      expect(await canSendEmail("leave_applied")).toBe(true);
    });
  });

  describe("getThresholds", () => {
    it("returns threshold values", async () => {
      pool.query.mockResolvedValue({
        rows: [{ ...mockRule, threshold_count: 5, threshold_days: 30 }],
      });

      const result = await getThresholds("leave_applied");
      expect(result.threshold_count).toBe(5);
      expect(result.threshold_days).toBe(30);
    });

    it("returns null when rule not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      expect(await getThresholds("nonexistent")).toBeNull();
    });
  });
});
