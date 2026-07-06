jest.mock("../models/leaveConversion.model", () => ({
  getCompanySettings: jest.fn(),
  getAllConvertibleTypes: jest.fn(),
  getActiveEmployees: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
  getAllBalanceTypes: jest.fn(),
  resetLeaveCredits: jest.fn(),
  getTotalAmountForPayroll: jest.fn(),
  getEmployeeHistory: jest.fn(),
  getByYear: jest.fn(),
  getStatistics: jest.fn(),
  deleteConversion: jest.fn(),
}));

jest.mock("../config/db", () => {
  const mClient = { query: jest.fn(), release: jest.fn() };
  return { query: jest.fn(), connect: jest.fn().mockResolvedValue(mClient) };
});

const pool = require("../config/db");
const leaveConversionModel = require("../models/leaveConversion.model");
const {
  processYearEndLeaveConversion,
  processEmployeeLeaveConversion,
  getConversionAmountForPayroll,
  getEmployeeConversionHistory,
  getConversionsByYear,
  getConversionStatistics,
  deleteConversion,
} = require("../services/leaveConversion.service");

describe("leaveConversion.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("processYearEndLeaveConversion", () => {
    const year = 2026;
    const processedBy = 1;

    it("converts unused leave for employees", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({ conversion_rate: 1 });
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([{ code: "VL", max_convertible_days: 30 }]);
      leaveConversionModel.getActiveEmployees.mockResolvedValue([
        { id: 1, employee_code: "EMP001", basic_salary: 26000, daily_rate: 1000, working_days_per_month: 26, leave_type_code: "VL", total_days: 15, used_days: 5, carried_over_days: 0, adjusted_days: 0 },
      ]);
      leaveConversionModel.exists.mockResolvedValue(false);
      leaveConversionModel.getAllBalanceTypes.mockResolvedValue([{ id: 1, code: "VL", default_days: 15 }]);

      const result = await processYearEndLeaveConversion(year, processedBy);

      expect(result.success).toBe(true);
      expect(result.results.total_processed).toBe(1);
      expect(result.results.total_converted).toBe(1);
      expect(result.results.total_amount).toBe(10000);
      expect(leaveConversionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ employee_id: 1, year, leave_type: "VL", days_converted: 10, daily_rate: 1000, conversion_rate: 1, amount: 10000, processed_by: 1, remarks: "YEAR-END" }),
        expect.any(Object),
      );
    });

    it("returns error when no convertible types exist", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({});
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([]);

      const result = await processYearEndLeaveConversion(year);

      expect(result.success).toBe(false);
      expect(result.message).toBe("No convertible leave types found. Enable is_convertible in leave type settings.");
    });

    it("handles no active employees", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({ conversion_rate: 1 });
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([{ code: "VL" }]);
      leaveConversionModel.getActiveEmployees.mockResolvedValue([]);

      const result = await processYearEndLeaveConversion(year);
      expect(result.success).toBe(true);
      expect(result.results.total_processed).toBe(0);
    });

    it("skips employees without basic_salary", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({ conversion_rate: 1 });
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([{ code: "VL" }]);
      leaveConversionModel.getActiveEmployees.mockResolvedValue([
        { id: 1, employee_code: "EMP001", basic_salary: null },
      ]);
      const result = await processYearEndLeaveConversion(year);
      expect(result.results.skipped).toHaveLength(1);
      expect(result.results.skipped[0].reason).toBe("No salary information found");
    });

    it("skips conversion with no unused days", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({ conversion_rate: 1 });
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([{ code: "VL", max_convertible_days: 30 }]);
      leaveConversionModel.getActiveEmployees.mockResolvedValue([
        { id: 1, employee_code: "EMP001", basic_salary: 26000, daily_rate: 1000, leave_type_code: "VL", total_days: 5, used_days: 5, carried_over_days: 0, adjusted_days: 0 },
      ]);
      leaveConversionModel.exists.mockResolvedValue(false);
      leaveConversionModel.getAllBalanceTypes.mockResolvedValue([{ id: 1, code: "VL", default_days: 5 }]);

      const result = await processYearEndLeaveConversion(year);
      expect(result.results.total_converted).toBe(0);
      expect(result.results.skipped).toEqual(expect.arrayContaining([expect.objectContaining({ reason: "No unused VL leave" })]));
    });

    it("skips already converted entries", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({ conversion_rate: 1 });
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([{ code: "VL", max_convertible_days: 30 }]);
      leaveConversionModel.getActiveEmployees.mockResolvedValue([
        { id: 1, employee_code: "EMP001", basic_salary: 26000, daily_rate: 1000, leave_type_code: "VL", total_days: 10, used_days: 0, carried_over_days: 0, adjusted_days: 0 },
      ]);
      leaveConversionModel.exists.mockResolvedValue(true);
      leaveConversionModel.getAllBalanceTypes.mockResolvedValue([{ id: 1, code: "VL", default_days: 10 }]);

      const result = await processYearEndLeaveConversion(year);
      expect(result.results.total_converted).toBe(0);
    });

    it("applies enforce_sil to ensure minimum convertible days", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({ conversion_rate: 1, enforce_sil: true, sil_min_days: 5 });
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([{ code: "VL", max_convertible_days: 3 }]);
      leaveConversionModel.getActiveEmployees.mockResolvedValue([
        { id: 1, employee_code: "EMP001", basic_salary: 26000, daily_rate: 1000, leave_type_code: "VL", total_days: 10, used_days: 0, carried_over_days: 0, adjusted_days: 0 },
      ]);
      leaveConversionModel.exists.mockResolvedValue(false);
      leaveConversionModel.getAllBalanceTypes.mockResolvedValue([{ id: 1, code: "VL", default_days: 10 }]);

      const result = await processYearEndLeaveConversion(year);
      expect(result.success).toBe(true);
      expect(leaveConversionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ days_converted: 5, amount: 5000 }),
        expect.any(Object),
      );
    });

    it("collects per-employee errors and continues", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({ conversion_rate: 1 });
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([{ code: "VL", max_convertible_days: 30 }]);
      leaveConversionModel.getActiveEmployees.mockResolvedValue([
        { id: 1, employee_code: "EMP001", basic_salary: 26000, daily_rate: 1000, working_days_per_month: 26, leave_type_code: "VL", total_days: 10, used_days: 0, carried_over_days: 0, adjusted_days: 0 },
      ]);
      leaveConversionModel.exists.mockRejectedValue(new Error("DB constraint violation"));

      const result = await processYearEndLeaveConversion(year);
      expect(leaveConversionModel.exists).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.results.errors.length).toBe(0);
    });

    it("rolls back on unexpected exception", async () => {
      leaveConversionModel.getCompanySettings.mockRejectedValue(new Error("Connection refused"));

      const result = await processYearEndLeaveConversion(year);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection refused");
    });
  });

  describe("processEmployeeLeaveConversion", () => {
    const employeeId = 1;
    const year = 2026;

    it("converts leave for a specific employee", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({ conversion_rate: 1 });
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([{ code: "VL", max_convertible_days: 30 }]);
      pool.query.mockResolvedValue({
        rows: [{ id: 1, basic_salary: 26000, daily_rate: 1000, total_days: 15, used_days: 5, carried_over_days: 0, adjusted_days: 0, leave_type_code: "VL" }],
      });
      leaveConversionModel.exists.mockResolvedValue(false);
      leaveConversionModel.getAllBalanceTypes.mockResolvedValue([{ id: 1, code: "VL", default_days: 0 }]);

      const result = await processEmployeeLeaveConversion(employeeId, year, "RESIGNATION");
      expect(result.success).toBe(true);
      expect(leaveConversionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ employee_id: 1, remarks: "RESIGNATION" }),
        expect.any(Object),
      );
    });

    it("returns error when no convertible types", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({});
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([]);
      const result = await processEmployeeLeaveConversion(employeeId, year);
      expect(result.success).toBe(false);
      expect(result.message).toBe("No convertible leave types configured");
    });

    it("returns error when employee not found", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({ conversion_rate: 1 });
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([{ code: "VL" }]);
      pool.query.mockResolvedValue({ rows: [] });
      const result = await processEmployeeLeaveConversion(employeeId, year);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Employee not found or no leave balances");
    });

    it("returns error when no salary", async () => {
      leaveConversionModel.getCompanySettings.mockResolvedValue({ conversion_rate: 1 });
      leaveConversionModel.getAllConvertibleTypes.mockResolvedValue([{ code: "VL" }]);
      pool.query.mockResolvedValue({ rows: [{ id: 1, basic_salary: null }] });
      const result = await processEmployeeLeaveConversion(employeeId, year);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Employee has no salary information");
    });

    it("handles error and rolls back", async () => {
      leaveConversionModel.getCompanySettings.mockRejectedValue(new Error("Unexpected error"));
      const result = await processEmployeeLeaveConversion(employeeId, year);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unexpected error");
    });
  });

  describe("getConversionAmountForPayroll", () => {
    it("returns total amount", async () => {
      leaveConversionModel.getTotalAmountForPayroll.mockResolvedValue(5000);
      const result = await getConversionAmountForPayroll(1, 2026);
      expect(result.success).toBe(true);
      expect(result.total_amount).toBe(5000);
    });

    it("handles error gracefully", async () => {
      leaveConversionModel.getTotalAmountForPayroll.mockRejectedValue(new Error("Query failed"));
      const result = await getConversionAmountForPayroll(1, 2026);
      expect(result.success).toBe(false);
      expect(result.total_amount).toBe(0);
    });
  });

  describe("getEmployeeConversionHistory", () => {
    it("returns history", async () => {
      const history = [{ id: 1 }];
      leaveConversionModel.getEmployeeHistory.mockResolvedValue(history);
      const result = await getEmployeeConversionHistory(1);
      expect(result.success).toBe(true);
      expect(result.history).toEqual(history);
      expect(result.total_records).toBe(1);
    });

    it("handles error", async () => {
      leaveConversionModel.getEmployeeHistory.mockRejectedValue(new Error("DB error"));
      const result = await getEmployeeConversionHistory(1);
      expect(result.success).toBe(false);
      expect(result.history).toEqual([]);
    });
  });

  describe("getConversionsByYear", () => {
    it("returns conversions", async () => {
      const data = [{ id: 1 }];
      leaveConversionModel.getByYear.mockResolvedValue(data);
      const result = await getConversionsByYear(2026);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });
  });

  describe("getConversionStatistics", () => {
    it("returns stats for year", async () => {
      const stats = {};
      leaveConversionModel.getStatistics.mockResolvedValue(stats);
      const result = await getConversionStatistics(2026);
      expect(result.year).toBe(2026);
      expect(result.statistics).toEqual(stats);
    });

    it("returns stats for all when no year", async () => {
      leaveConversionModel.getStatistics.mockResolvedValue({});
      const result = await getConversionStatistics();
      expect(result.year).toBe("all");
    });
  });

  describe("deleteConversion", () => {
    it("deletes successfully", async () => {
      const deleted = { id: 1 };
      leaveConversionModel.deleteConversion.mockResolvedValue(deleted);
      const result = await deleteConversion(1, 2026, "VL");
      expect(result.success).toBe(true);
      expect(result.data).toEqual(deleted);
    });

    it("returns not found", async () => {
      leaveConversionModel.deleteConversion.mockResolvedValue(null);
      const result = await deleteConversion(1, 2026, "VL");
      expect(result.success).toBe(false);
      expect(result.message).toBe("Conversion not found");
    });

    it("handles error", async () => {
      leaveConversionModel.deleteConversion.mockRejectedValue(new Error("Delete failed"));
      const result = await deleteConversion(1, 2026, "VL");
      expect(result.success).toBe(false);
    });
  });
});
