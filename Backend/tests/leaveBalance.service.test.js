jest.mock("../config/db", () => ({ query: jest.fn() }));

const pool = require("../config/db");
const {
  getEmployeeBalances,
  getEmployeeBalanceMap,
  getEmployeesBalances,
  getPayrollRelevantTypes,
  getConvertibleBalances,
  getLeaveTypeByCode,
} = require("../services/leaveBalance.service");

const mockRow = (code, overrides = {}) => ({
  employee_id: 1, leave_type_id: 1, code, name: `${code} Leave`,
  is_paid: true, is_convertible: false, max_convertible_days: 0,
  requires_balance: true, is_unlimited: false, include_in_credits: true,
  affects_payroll: false, deducts_salary: false, sort_order: 1,
  year: 2026, total_days: 10, used_days: 2, carried_over_days: 1, adjusted_days: 0,
  remaining_days: 9, ...overrides,
});

describe("leaveBalance.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("getEmployeeBalances", () => {
    it("returns balances for employee and year", async () => {
      pool.query.mockResolvedValue({ rows: [mockRow("VL"), mockRow("SL")] });
      const result = await getEmployeeBalances(1, 2026);
      expect(result).toHaveLength(2);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("employee_leave_balances"), [1, 2026]);
    });

    it("defaults year to current year", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await getEmployeeBalances(1);
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1, new Date().getFullYear()]);
    });
  });

  describe("getEmployeeBalanceMap", () => {
    it("returns map keyed by code", async () => {
      pool.query.mockResolvedValue({ rows: [mockRow("VL"), mockRow("SL")] });
      const map = await getEmployeeBalanceMap(1, 2026);
      expect(map.get("VL")).toBeDefined();
      expect(map.get("SL")).toBeDefined();
      expect(map.size).toBe(2);
    });
  });

  describe("getEmployeesBalances", () => {
    it("returns empty map for empty ids", async () => {
      const result = await getEmployeesBalances([], 2026);
      expect(result.size).toBe(0);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("returns balances grouped by employee", async () => {
      pool.query.mockResolvedValue({ rows: [mockRow("VL"), { ...mockRow("SL"), employee_id: 2 }] });
      const map = await getEmployeesBalances([1, 2], 2026);
      expect(map.get(1)).toHaveLength(1);
      expect(map.get(2)).toHaveLength(1);
    });
  });

  describe("getPayrollRelevantTypes", () => {
    it("returns enabled leave types for payroll", async () => {
      pool.query.mockResolvedValue({ rows: [{ code: "VL", name: "Vacation", is_paid: true, affects_payroll: true, deducts_salary: false }] });
      const result = await getPayrollRelevantTypes();
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("VL");
    });
  });

  describe("getConvertibleBalances", () => {
    it("filters only convertible balances", async () => {
      pool.query.mockResolvedValue({ rows: [
        mockRow("VL", { is_convertible: true }),
        mockRow("SL", { is_convertible: false }),
      ] });
      const result = await getConvertibleBalances(1, 2026);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("VL");
    });
  });

  describe("getLeaveTypeByCode", () => {
    it("returns leave type when found", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, code: "VL" }] });
      const result = await getLeaveTypeByCode("VL");
      expect(result.code).toBe("VL");
    });

    it("returns null when not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await getLeaveTypeByCode("XX");
      expect(result).toBeNull();
    });
  });
});
