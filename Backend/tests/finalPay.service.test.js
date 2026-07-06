const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../config/db", () => ({
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue(mockClient),
}));

jest.mock("../services/leaveConversion.service", () => ({
  processEmployeeLeaveConversion: jest.fn(),
}));

jest.mock("../services/leaveBalance.service", () => ({
  getEmployeesBalances: jest.fn(),
  getConvertibleBalances: jest.fn(),
}));

jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock("../utils/finalPaySlipGenerator", () => ({
  generateFinalPaySlip: jest.fn(),
}));

const pool = require("../config/db");
const leaveConversionService = require("../services/leaveConversion.service");
const leaveBalanceService = require("../services/leaveBalance.service");
const {
  calculateWorkUnits,
  getEmployeesForFinalPay,
  calculateFinalPay,
  processFinalPay,
  getFinalPayHistory,
  getFinalPayById,
  downloadFinalPaySlip,
} = require("../services/finalPay.service");

const mockEmpRow = (overrides = {}) => ({
  id: 1,
  first_name: "John",
  last_name: "Doe",
  middle_name: "M",
  suffix: "",
  employee_code: "EMP001",
  status: "RESIGNED",
  resignation_date: "2026-06-15",
  termination_date: null,
  last_working_date: "2026-06-15",
  final_pay_processed: false,
  final_pay_date: null,
  final_pay_amount: null,
  basic_salary: 26000,
  daily_rate: 1000,
  working_days_per_month: 26,
  sss_number: "12-3456789-0",
  philhealth_number: "12-345678901-2",
  hdmf_number: "1234-5678-9012",
  tin_number: "123-456-789-000",
  ...overrides,
});

const mockAttendanceRow = (date, status, overrides = {}) => ({
  date,
  status,
  work_fraction: status === "HALF_DAY" ? 0.5 : null,
  day_type: "REGULAR",
  ...overrides,
});

const mockFinalPayRow = (overrides = {}) => ({
  id: 1,
  employee_id: 1,
  resignation_date: "2026-06-15",
  termination_date: null,
  last_working_date: "2026-06-15",
  days_worked: 15,
  salary_until_last_day: 15000,
  leave_conversion_amount: 5000,
  total_amount: 20000,
  processed_by: 1,
  processed_at: "2026-06-30T00:00:00.000Z",
  status: "PROCESSED",
  first_name: "John",
  last_name: "Doe",
  middle_name: "M",
  suffix: "",
  employee_code: "EMP001",
  e_status: "RESIGNED",
  processed_by_name: "Admin",
  sss_number: "12-3456789-0",
  philhealth_number: "12-345678901-2",
  hdmf_number: "1234-5678-9012",
  tin_number: "123-456-789-000",
  basic_salary: 26000,
  daily_rate: 1000,
  ...overrides,
});

describe("finalPay.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================
  // calculateWorkUnits
  // ============================
  describe("calculateWorkUnits", () => {
    it("counts present days as 1 unit each", async () => {
      const rows = [
        mockAttendanceRow("2026-06-01", "PRESENT"),
        mockAttendanceRow("2026-06-02", "PRESENT"),
        mockAttendanceRow("2026-06-03", "PRESENT"),
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-03");

      expect(result.total_work_units).toBe(3);
      expect(result.breakdown.present_days).toBe(3);
    });

    it("counts late days as 1 unit each", async () => {
      const rows = [
        mockAttendanceRow("2026-06-01", "LATE"),
        mockAttendanceRow("2026-06-02", "PRESENT"),
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-02");

      expect(result.total_work_units).toBe(2);
      expect(result.breakdown.late_days).toBe(1);
      expect(result.breakdown.present_days).toBe(1);
    });

    it("counts half days using work_fraction", async () => {
      const rows = [
        { ...mockAttendanceRow("2026-06-01", "HALF_DAY"), work_fraction: 0.5 },
        mockAttendanceRow("2026-06-02", "PRESENT"),
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-02");

      expect(result.total_work_units).toBe(1.5);
      expect(result.breakdown.half_days).toBe(1);
    });

    it("defaults half_day work_fraction to 0.5 when null", async () => {
      const rows = [
        { ...mockAttendanceRow("2026-06-01", "HALF_DAY"), work_fraction: null },
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-01");

      expect(result.total_work_units).toBe(0.5);
    });

    it("counts leave days as 1 unit each", async () => {
      const rows = [
        mockAttendanceRow("2026-06-01", "LEAVE"),
        mockAttendanceRow("2026-06-02", "LEAVE"),
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-02");

      expect(result.total_work_units).toBe(2);
      expect(result.breakdown.leave_days).toBe(2);
    });

    it("counts absent days as 0 units", async () => {
      const rows = [
        mockAttendanceRow("2026-06-01", "ABSENT"),
        mockAttendanceRow("2026-06-02", "ABSENT"),
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-02");

      expect(result.total_work_units).toBe(0);
      expect(result.breakdown.absent_days).toBe(2);
    });

    it("counts null status days as absent", async () => {
      const rows = [
        { ...mockAttendanceRow("2026-06-01", null), status: null },
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-01");

      expect(result.total_work_units).toBe(0);
      expect(result.breakdown.absent_days).toBe(1);
    });

    it("counts holiday with PRESENT status as worked", async () => {
      const rows = [
        { ...mockAttendanceRow("2026-06-01", "PRESENT"), day_type: "REGULAR_HOLIDAY" },
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-01");

      expect(result.total_work_units).toBe(1);
      expect(result.breakdown.present_days).toBe(1);
      expect(result.breakdown.holiday_worked).toBe(1);
    });

    it("skips holiday with no attendance", async () => {
      const rows = [
        { ...mockAttendanceRow("2026-06-01", null), day_type: "REGULAR_HOLIDAY", status: null },
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-01");

      expect(result.total_work_units).toBe(0);
      expect(result.breakdown.absent_days).toBe(0);
      expect(result.breakdown.holiday_worked).toBe(0);
    });

    it("counts holiday with LATE status as worked", async () => {
      const rows = [
        { ...mockAttendanceRow("2026-06-01", "LATE"), day_type: "SPECIAL_HOLIDAY" },
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-01");

      expect(result.total_work_units).toBe(1);
      expect(result.breakdown.late_days).toBe(1);
      expect(result.breakdown.holiday_worked).toBe(1);
    });

    it("skips non-working days (REST_DAY, NON_WORKING) that are not holidays", async () => {
      const rows = [
        { ...mockAttendanceRow("2026-06-01", "PRESENT"), day_type: "REST_DAY" },
        { ...mockAttendanceRow("2026-06-02", "PRESENT"), day_type: "NON_WORKING" },
        mockAttendanceRow("2026-06-03", "PRESENT"),
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-03");

      expect(result.total_work_units).toBe(1);
      expect(result.breakdown.present_days).toBe(1);
    });

    it("handles empty result set", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await calculateWorkUnits(1, "2026-06-01", "2026-06-01");

      expect(result.total_work_units).toBe(0);
      expect(result.breakdown.present_days).toBe(0);
      expect(result.breakdown.absent_days).toBe(0);
    });

    it("passes correct parameters to pool.query", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await calculateWorkUnits(42, "2026-01-01", "2026-01-31");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("generate_series"),
        ["2026-01-01", "2026-01-31", 42],
      );
    });
  });

  // ============================
  // getEmployeesForFinalPay
  // ============================
  describe("getEmployeesForFinalPay", () => {
    const baseRows = [mockEmpRow()];

    it("returns paginated employees with balances", async () => {
      pool.query.mockResolvedValueOnce({ rows: baseRows });
      pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });
      const balancesMap = new Map();
      balancesMap.set(1, [{ code: "VL", total_days: 10, used_days: 2 }]);
      leaveBalanceService.getEmployeesBalances.mockResolvedValue(balancesMap);

      const result = await getEmployeesForFinalPay(1, 10, "", null);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].vacation_leave).toBe(10);
      expect(result.data[0].used_vacation_leave).toBe(2);
      expect(result.data[0].sick_leave).toBe(0);
      expect(result.data[0].balances).toEqual([{ code: "VL", total_days: 10, used_days: 2 }]);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it("uses default page and limit", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });
      leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());

      const result = await getEmployeesForFinalPay();

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it("filters by search term", async () => {
      pool.query.mockResolvedValueOnce({ rows: baseRows });
      pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });
      leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());

      await getEmployeesForFinalPay(1, 10, "John", null);

      expect(pool.query.mock.calls[0][1][2]).toBe("%John%");
    });

    it("filters by allowed branch ids", async () => {
      pool.query.mockResolvedValueOnce({ rows: baseRows });
      pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });
      leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());

      await getEmployeesForFinalPay(1, 10, "", [1, 2]);

      const sql = pool.query.mock.calls[0][0];
      expect(sql).toContain("branch_id = ANY");
      expect(pool.query.mock.calls[0][1][3]).toEqual([1, 2]);
    });

    it("handles no employees found", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });
      leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());

      const result = await getEmployeesForFinalPay(1, 10, "", null);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("skips balance enrichment when no employee ids returned", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });

      await getEmployeesForFinalPay(1, 10, "", null);

      expect(leaveBalanceService.getEmployeesBalances).not.toHaveBeenCalled();
    });
  });

  // ============================
  // calculateFinalPay
  // ============================
  describe("calculateFinalPay", () => {
    it("returns full calculation breakdown on success", async () => {
      const empRow = mockEmpRow();
      mockClient.query
        .mockResolvedValueOnce()                // BEGIN
        .mockResolvedValueOnce({ rows: [empRow] }) // employee query
        .mockResolvedValueOnce();                  // COMMIT

      leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());
      leaveBalanceService.getConvertibleBalances.mockResolvedValue([]);
      leaveConversionService.processEmployeeLeaveConversion.mockResolvedValue({});
      pool.query.mockResolvedValue({ rows: [mockAttendanceRow("2026-06-01", "PRESENT")] });

      const result = await calculateFinalPay(1);

      expect(result.success).toBe(true);
      expect(result.data.employee_id).toBe(1);
      expect(result.data.employee_name).toBe("John Doe");
      expect(result.data.last_working_date).toBe("2026-06-15");
      expect(result.data.work_units).toBe(1);
      expect(result.data.salary_until_last_day).toBe(1000);
      expect(result.data.leave_conversion_amount).toBe(0);
      expect(result.data.total_final_pay).toBe(1000);
      expect(result.data.breakdown.present_days).toBe(1);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("includes dynamic leave conversion in total", async () => {
      const empRow = mockEmpRow();
      mockClient.query
        .mockResolvedValueOnce()
        .mockResolvedValueOnce({ rows: [empRow] })
        .mockResolvedValueOnce();

      leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());
      leaveBalanceService.getConvertibleBalances.mockResolvedValue([
        { code: "VL", name: "Vacation Leave", total_days: 10, used_days: 2, carried_over_days: 0, adjusted_days: 0, max_convertible_days: 30 },
      ]);
      leaveConversionService.processEmployeeLeaveConversion.mockResolvedValue({});
      pool.query.mockResolvedValue({ rows: [mockAttendanceRow("2026-06-01", "PRESENT")] });

      const result = await calculateFinalPay(1);

      expect(result.data.leave_conversion_amount).toBe(8000);
      expect(result.data.total_final_pay).toBe(9000);
    });

    it("throws if employee not found or not resigned/terminated", async () => {
      mockClient.query
        .mockResolvedValueOnce()                // BEGIN
        .mockResolvedValueOnce({ rows: [] });   // employee query - empty

      await expect(calculateFinalPay(999)).rejects.toThrow("Employee not found or not resigned/terminated");
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("throws if no resignation/termination date found", async () => {
      mockClient.query
        .mockResolvedValueOnce()                // BEGIN
        .mockResolvedValueOnce({                // employee query
          rows: [mockEmpRow({ resignation_date: null, termination_date: null, last_working_date: null })],
        });
      leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());

      await expect(calculateFinalPay(1)).rejects.toThrow("No resignation/termination date found");
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });

    it("calculates daily rate from basic_salary when daily_rate is not set", async () => {
      const empRow = mockEmpRow({ daily_rate: null });
      mockClient.query
        .mockResolvedValueOnce()                // BEGIN
        .mockResolvedValueOnce({ rows: [empRow] }) // employee query
        .mockResolvedValueOnce();                  // COMMIT

      leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());
      leaveBalanceService.getConvertibleBalances.mockResolvedValue([]);
      leaveConversionService.processEmployeeLeaveConversion.mockResolvedValue({});
      pool.query.mockResolvedValue({ rows: [mockAttendanceRow("2026-06-01", "PRESENT")] });

      const result = await calculateFinalPay(1);

      expect(result.data.daily_rate).toBe(1000);
      expect(result.data.salary_until_last_day).toBe(1000);
    });

    it("handles leave conversion warning gracefully", async () => {
      const empRow = mockEmpRow();
      mockClient.query
        .mockResolvedValueOnce()                // BEGIN
        .mockResolvedValueOnce({ rows: [empRow] }) // employee query
        .mockResolvedValueOnce();                  // COMMIT

      leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());
      leaveBalanceService.getConvertibleBalances.mockResolvedValue([]);
      leaveConversionService.processEmployeeLeaveConversion.mockRejectedValue(new Error("DB error"));
      pool.query.mockResolvedValue({ rows: [mockAttendanceRow("2026-06-01", "PRESENT")] });

      const result = await calculateFinalPay(1);

      expect(result.success).toBe(true);
    });

    it("releases client on error after rollback", async () => {
      mockClient.query
        .mockResolvedValueOnce()                // BEGIN
        .mockResolvedValueOnce({ rows: [] });   // employee query - empty

      await expect(calculateFinalPay(999)).rejects.toThrow();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // ============================
  // processFinalPay
  // ============================
  describe("processFinalPay", () => {
    it("processes final pay successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce()                    // 1. BEGIN (processFinalPay)
        .mockResolvedValueOnce({ rows: [] })        // 2. SELECT existing (not yet processed)
        .mockResolvedValueOnce()                    // 3. BEGIN (calculateFinalPay)
        .mockResolvedValueOnce({ rows: [mockEmpRow()] }) // 4. SELECT employee
        .mockResolvedValueOnce()                    // 5. COMMIT (calculateFinalPay)
        .mockResolvedValueOnce({ rows: [mockFinalPayRow()] }) // 6. INSERT INTO final_pay
        .mockResolvedValueOnce()                    // 7. UPDATE employees
        .mockResolvedValueOnce();                   // 8. COMMIT (processFinalPay)

      leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());
      leaveBalanceService.getConvertibleBalances.mockResolvedValue([]);
      leaveConversionService.processEmployeeLeaveConversion.mockResolvedValue({});
      pool.query.mockResolvedValue({ rows: [mockAttendanceRow("2026-06-01", "PRESENT")] });

      const result = await processFinalPay(1, 1);

      expect(result.success).toBe(true);
      expect(result.message).toContain("processed successfully");
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();

      const insertCall = mockClient.query.mock.calls.find(
        (c) => c[0] && c[0].toString().includes("INSERT INTO final_pay"),
      );
      expect(insertCall).toBeDefined();

      const updateCall = mockClient.query.mock.calls.find(
        (c) => c[0] && c[0].toString().includes("UPDATE employees"),
      );
      expect(updateCall).toBeDefined();
    });

    it("throws if final pay already processed", async () => {
      mockClient.query
        .mockResolvedValueOnce()                    // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // existing record found
        .mockResolvedValueOnce();                   // ROLLBACK

      await expect(processFinalPay(1, 1)).rejects.toThrow("Final pay already processed for this employee");
    });

    it("throws if calculation fails", async () => {
      mockClient.query
        .mockResolvedValueOnce()                    // 1. BEGIN (processFinalPay)
        .mockResolvedValueOnce({ rows: [] })        // 2. SELECT existing (not yet processed)
        .mockResolvedValueOnce()                    // 3. BEGIN (calculateFinalPay)
        .mockResolvedValueOnce({ rows: [] })        // 4. SELECT employee (not found)
        .mockResolvedValueOnce();                   // 5. ROLLBACK (calculateFinalPay)
      // processFinalPay catches the error and ROLLBACKs again

      await expect(processFinalPay(1, 1)).rejects.toThrow("Employee not found or not resigned/terminated");
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // ============================
  // getFinalPayHistory
  // ============================
  describe("getFinalPayHistory", () => {
    it("returns paginated final pay history", async () => {
      pool.query.mockResolvedValueOnce({ rows: [mockFinalPayRow()] });
      pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });

      const result = await getFinalPayHistory(1, 10, "", null);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it("filters by search term", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });

      await getFinalPayHistory(1, 10, "John", null);

      expect(pool.query.mock.calls[0][1][2]).toBe("%John%");
    });

    it("filters by allowed branch ids", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });

      await getFinalPayHistory(1, 10, "", [3, 4]);

      expect(pool.query.mock.calls[0][0]).toContain("branch_id = ANY");
      expect(pool.query.mock.calls[0][1][3]).toEqual([3, 4]);
    });

    it("handles empty history", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });

      const result = await getFinalPayHistory(1, 10, "", null);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("uses default pagination values", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });

      const result = await getFinalPayHistory();

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  // ============================
  // getFinalPayById
  // ============================
  describe("getFinalPayById", () => {
    it("returns record when found", async () => {
      pool.query.mockResolvedValue({ rows: [mockFinalPayRow()] });

      const result = await getFinalPayById(1);

      expect(result.id).toBe(1);
      expect(result.employee_id).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("FROM final_pay fp"), [1]);
    });

    it("throws when not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(getFinalPayById(999)).rejects.toThrow("Final pay record not found");
    });
  });

  // ============================
  // downloadFinalPaySlip
  // ============================
  describe("downloadFinalPaySlip", () => {
    it("generates final pay slip for valid record", async () => {
      const { generateFinalPaySlip } = require("../utils/finalPaySlipGenerator");
      pool.query.mockResolvedValue({ rows: [mockFinalPayRow()] });

      const res = {};
      await downloadFinalPaySlip(1, res);

      expect(generateFinalPaySlip).toHaveBeenCalledWith(res, expect.objectContaining({ id: 1 }));
    });

    it("throws when record not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(downloadFinalPaySlip(999, {})).rejects.toThrow("Final pay record not found");
    });
  });
});
