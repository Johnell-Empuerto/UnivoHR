jest.mock("../models/payRules.model", () => ({
  getAllPayRules: jest.fn(),
  getPayRuleById: jest.fn(),
  createPayRule: jest.fn(),
  updatePayRule: jest.fn(),
  deletePayRule: jest.fn(),
  getCalendarDays: jest.fn(),
  upsertCalendarDay: jest.fn(),
  deleteCalendarDay: jest.fn(),
}));

jest.mock("../config/db", () => ({ query: jest.fn() }));

const payRulesModel = require("../models/payRules.model");
const pool = require("../config/db");
const {
  getAllPayRules, getPayRuleById, createPayRule, updatePayRule, deletePayRule,
  getCalendarDays, upsertCalendarDay, deleteCalendarDay,
} = require("../services/payRules.service");

describe("payRules.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllPayRules", () => {
    it("delegates", async () => {
      payRulesModel.getAllPayRules.mockResolvedValue([{ day_type: "REGULAR_HOLIDAY", multiplier: 2 }]);
      expect(await getAllPayRules()).toEqual([{ day_type: "REGULAR_HOLIDAY", multiplier: 2 }]);
    });
  });

  describe("getPayRuleById", () => {
    it("returns rule when found", async () => {
      payRulesModel.getPayRuleById.mockResolvedValue({ id: 1 });
      expect(await getPayRuleById(1)).toEqual({ id: 1 });
    });

    it("throws NOT_FOUND when missing", async () => {
      payRulesModel.getPayRuleById.mockResolvedValue(null);
      await expect(getPayRuleById(999)).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("createPayRule", () => {
    it("creates with valid data", async () => {
      payRulesModel.createPayRule.mockResolvedValue({ id: 1, day_type: "REGULAR_HOLIDAY", multiplier: 2 });

      const result = await createPayRule({ day_type: "REGULAR_HOLIDAY", multiplier: 2 });
      expect(result.id).toBe(1);
    });

    it("throws VALIDATION_ERROR when day_type missing", async () => {
      await expect(createPayRule({ multiplier: 2 })).rejects.toThrow("VALIDATION_ERROR");
    });

    it("throws VALIDATION_ERROR when multiplier missing", async () => {
      await expect(createPayRule({ day_type: "REGULAR_HOLIDAY" })).rejects.toThrow("VALIDATION_ERROR");
    });
  });

  describe("updatePayRule", () => {
    it("updates with valid data", async () => {
      payRulesModel.updatePayRule.mockResolvedValue({ id: 1, day_type: "SPECIAL_HOLIDAY", multiplier: 1.3 });

      const result = await updatePayRule(1, { day_type: "SPECIAL_HOLIDAY", multiplier: 1.3 });
      expect(result.id).toBe(1);
    });

    it("throws VALIDATION_ERROR when day_type missing", async () => {
      await expect(updatePayRule(1, { multiplier: 2 })).rejects.toThrow("VALIDATION_ERROR");
    });

    it("throws NOT_FOUND when model returns falsy", async () => {
      payRulesModel.updatePayRule.mockResolvedValue(null);
      await expect(updatePayRule(999, { day_type: "REGULAR", multiplier: 1 })).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("deletePayRule", () => {
    it("deletes when not in use", async () => {
      payRulesModel.getPayRuleById.mockResolvedValue({ id: 1, day_type: "REGULAR" });
      pool.query.mockResolvedValue({ rows: [{ cnt: "0" }] });
      payRulesModel.deletePayRule.mockResolvedValue({ id: 1 });

      const result = await deletePayRule(1);
      expect(result).toEqual({ id: 1, day_type: "REGULAR" });
    });

    it("throws NOT_FOUND when missing", async () => {
      payRulesModel.getPayRuleById.mockResolvedValue(null);
      await expect(deletePayRule(999)).rejects.toThrow("NOT_FOUND");
    });

    it("throws 409 when payroll records exist", async () => {
      payRulesModel.getPayRuleById.mockResolvedValue({ id: 1 });
      pool.query.mockResolvedValue({ rows: [{ cnt: "5" }] });

      await expect(deletePayRule(1)).rejects.toMatchObject({
        message: "Pay rule is in use by existing payroll records",
        statusCode: 409,
      });
    });
  });

  describe("getCalendarDays", () => {
    it("delegates with valid dates", async () => {
      payRulesModel.getCalendarDays.mockResolvedValue([{ date: "2026-07-06" }]);
      expect(await getCalendarDays("2026-01-01", "2026-12-31")).toEqual([{ date: "2026-07-06" }]);
    });

    it("throws VALIDATION_ERROR when dates missing", async () => {
      await expect(getCalendarDays(null, "2026-12-31")).rejects.toThrow("VALIDATION_ERROR");
      await expect(getCalendarDays("2026-01-01", null)).rejects.toThrow("VALIDATION_ERROR");
    });
  });

  describe("upsertCalendarDay", () => {
    it("upserts with valid data", async () => {
      payRulesModel.upsertCalendarDay.mockResolvedValue({ date: "2026-07-06", day_type: "REGULAR_HOLIDAY" });

      const result = await upsertCalendarDay({ date: "2026-07-06", day_type: "REGULAR_HOLIDAY" });
      expect(result.date).toBe("2026-07-06");
    });

    it("throws VALIDATION_ERROR when data missing", async () => {
      await expect(upsertCalendarDay({ date: "2026-07-06" })).rejects.toThrow("VALIDATION_ERROR");
      await expect(upsertCalendarDay({ day_type: "REGULAR" })).rejects.toThrow("VALIDATION_ERROR");
    });
  });

  describe("deleteCalendarDay", () => {
    it("deletes existing day", async () => {
      payRulesModel.deleteCalendarDay.mockResolvedValue({ date: "2026-07-06" });
      expect(await deleteCalendarDay("2026-07-06")).toEqual({ date: "2026-07-06" });
    });

    it("throws NOT_FOUND when missing", async () => {
      payRulesModel.deleteCalendarDay.mockResolvedValue(null);
      await expect(deleteCalendarDay("2026-01-01")).rejects.toThrow("NOT_FOUND");
    });
  });
});
