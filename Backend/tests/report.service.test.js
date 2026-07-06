jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../utils/branchAccess", () => ({ getUserBranchIds: jest.fn() }));
jest.mock("../services/leaveBalance.service", () => ({ getEmployeesBalances: jest.fn() }));

const pool = require("../config/db");
const { getUserBranchIds } = require("../utils/branchAccess");
const leaveBalanceService = require("../services/leaveBalance.service");

const {
  getEmployeeReport,
  getLeaveReport,
  getAttendanceReport,
  getPayrollReport,
  getBenefitsReport,
  getPerformanceReport,
  exportReport,
} = require("../services/report.service");

const ADMIN = { id: 1, role: "ADMIN" };
const NON_ADMIN = { id: 2, role: "USER" };

const mockRows = (rows) => ({ rows });

const getSQL = () => pool.query.mock.calls[0][0];
const getParams = () => pool.query.mock.calls[0][1];

describe("report.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // getEmployeeReport
  // ==========================================
  describe("getEmployeeReport", () => {
    const baseFilters = { reportType: "master_list" };

    it("returns employee data for ADMIN", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe" }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await getEmployeeReport(ADMIN, baseFilters);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].employee_name).toBe("John Doe");
      expect(result.pagination.total).toBe(1);
    });

    it("filters by active status", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(ADMIN, { ...baseFilters, reportType: "active" });
      expect(getSQL()).toMatch(/e\.status/);
      expect(getParams()).toContain("ACTIVE");
    });

    it("filters by inactive status", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(ADMIN, { ...baseFilters, reportType: "inactive" });
      expect(getSQL()).toMatch(/e\.status/);
      expect(getParams()).toContain("INACTIVE");
    });

    it("filters active_regular", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(ADMIN, { ...baseFilters, reportType: "active_regular" });
      expect(getParams()).toContain("ACTIVE");
      expect(getParams()).toContain("REGULAR");
    });

    it("filters active_probationary", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(ADMIN, { ...baseFilters, reportType: "active_probationary" });
      expect(getParams()).toContain("ACTIVE");
      expect(getParams()).toContain("PROBATIONARY");
    });

    it("filters new_hires with date range", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(ADMIN, {
        ...baseFilters, reportType: "new_hires",
        startDate: "2026-01-01", endDate: "2026-06-30",
      });
      expect(getSQL()).toMatch(/hired_date/);
      expect(getParams()).toContain("2026-01-01");
      expect(getParams()).toContain("2026-06-30");
    });

    it("filters resigned_terminated", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(ADMIN, { ...baseFilters, reportType: "resigned_terminated" });
      expect(getParams()).toContain("RESIGNED");
      expect(getParams()).toContain("TERMINATED");
    });

    it("adds branch filter for non-ADMIN", async () => {
      getUserBranchIds.mockResolvedValue([10, 20]);
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(NON_ADMIN, baseFilters);
      expect(getUserBranchIds).toHaveBeenCalledWith(2);
      expect(getSQL()).toMatch(/branch_id = ANY/);
    });

    it("returns early when branchIds is empty for non-ADMIN", async () => {
      getUserBranchIds.mockResolvedValue([]);
      const result = await getEmployeeReport(NON_ADMIN, baseFilters);
      expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("applies department filter", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(ADMIN, { ...baseFilters, department: "IT" });
      expect(getSQL()).toMatch(/e\.department/);
      expect(getParams()).toContain("IT");
    });

    it("applies branch_id filter", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(ADMIN, { ...baseFilters, branch_id: 5 });
      expect(getSQL()).toMatch(/e\.branch_id/);
      expect(getParams()).toContain(5);
    });

    it("applies search filter", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(ADMIN, { ...baseFilters, search: "john" });
      expect(getSQL()).toMatch(/ILIKE/);
      expect(getParams()).toContain("%john%");
    });

    it("applies pagination", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(ADMIN, { ...baseFilters, page: 2, limit: 10 });
      expect(getSQL()).toMatch(/LIMIT/);
      const params = getParams();
      expect(params).toContain(10);
      expect(params).toContain(10);
    });

    it("handles employee_name with middle name and suffix", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", middle_name: "M", last_name: "Doe", suffix: "Jr" }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await getEmployeeReport(ADMIN, baseFilters);
      expect(result.data[0].employee_name).toBe("John M Doe, Jr");
    });

    it("handles employee_name without middle name or suffix", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", middle_name: null, last_name: "Doe", suffix: null }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await getEmployeeReport(ADMIN, baseFilters);
      expect(result.data[0].employee_name).toBe("John Doe");
    });

    it("applies status filter in master_list", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getEmployeeReport(ADMIN, { ...baseFilters, status: "RESIGNED" });
      expect(getSQL()).toMatch(/e\.status/);
      expect(getParams()).toContain("RESIGNED");
    });
  });

  // ==========================================
  // getLeaveReport
  // ==========================================
  describe("getLeaveReport", () => {
    const baseFilters = {};

    // --- Balance ---
    describe("reportType = balance", () => {
      it("returns leave balance report for ADMIN", async () => {
        const empRow = { id: 1, first_name: "John", last_name: "Doe", employee_code: "E001", department: "IT", branch_name: "Main" };
        pool.query
          .mockResolvedValueOnce(mockRows([empRow]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        const balanceMap = new Map();
        balanceMap.set(1, [
          { code: "VL", total_days: 15, used_days: 3, carried_over_days: 2, adjusted_days: 0 },
          { code: "SL", total_days: 10, used_days: 1, carried_over_days: 0, adjusted_days: 0 },
        ]);
        leaveBalanceService.getEmployeesBalances.mockResolvedValue(balanceMap);

        const result = await getLeaveReport(ADMIN, { ...baseFilters, reportType: "balance" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].employee_name).toBe("John Doe");
        expect(result.data[0].vacation_leave).toBe(15);
        expect(result.data[0].available_vacation).toBe(12);
        expect(result.data[0].sick_leave).toBe(10);
        expect(result.data[0].available_sick).toBe(9);
        expect(leaveBalanceService.getEmployeesBalances).toHaveBeenCalledWith([1], new Date().getFullYear());
      });

      it("returns zeros when no balances found", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", employee_code: "E001", department: "IT", branch_name: "Main" }]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());
        const result = await getLeaveReport(ADMIN, { ...baseFilters, reportType: "balance" });
        expect(result.data[0].vacation_leave).toBe(0);
        expect(result.data[0].available_vacation).toBe(0);
      });

      it("adds branch filter for non-ADMIN", async () => {
        getUserBranchIds.mockResolvedValue([10]);
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());
        await getLeaveReport(NON_ADMIN, { ...baseFilters, reportType: "balance" });
        expect(getUserBranchIds).toHaveBeenCalledWith(2);
      });

      it("returns early when branchIds empty for non-ADMIN", async () => {
        getUserBranchIds.mockResolvedValue([]);
        const result = await getLeaveReport(NON_ADMIN, { ...baseFilters, reportType: "balance" });
        expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      });

      it("applies department and search filter", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        leaveBalanceService.getEmployeesBalances.mockResolvedValue(new Map());
        await getLeaveReport(ADMIN, { ...baseFilters, reportType: "balance", department: "HR", search: "Jane" });
        expect(getSQL()).toMatch(/e\.department/);
        const params = getParams();
        expect(params).toContain("HR");
        expect(params).toContain("%Jane%");
      });

      it("handles empty empIds (no employees returned)", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        const result = await getLeaveReport(ADMIN, { ...baseFilters, reportType: "balance" });
        expect(leaveBalanceService.getEmployeesBalances).not.toHaveBeenCalled();
        expect(result.data).toEqual([]);
        expect(result.pagination.total).toBe(0);
      });
    });

    // --- Usage ---
    describe("reportType = usage", () => {
      it("returns approved leave usage for ADMIN", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", type: "VL", from_date: "2026-01-15", to_date: "2026-01-15", status: "APPROVED" }]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        const result = await getLeaveReport(ADMIN, { ...baseFilters, reportType: "usage" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].employee_name).toBe("John Doe");
        expect(result.pagination.total).toBe(1);
      });

      it("filters by date range and department", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getLeaveReport(ADMIN, {
          ...baseFilters, reportType: "usage",
          startDate: "2026-01-01", endDate: "2026-06-30", department: "IT",
        });
        expect(getSQL()).toMatch(/l\.from_date/);
        const params = getParams();
        expect(params).toContain("2026-01-01");
        expect(params).toContain("2026-06-30");
        expect(params).toContain("IT");
      });

      it("adds branch filter for non-ADMIN usage", async () => {
        getUserBranchIds.mockResolvedValue([5]);
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getLeaveReport(NON_ADMIN, { ...baseFilters, reportType: "usage" });
        expect(getUserBranchIds).toHaveBeenCalled();
      });
    });

    // --- Conversion ---
    describe("reportType = conversion", () => {
      it("returns leave conversion data", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ id: 1, employee_id: 1, days_converted: 5, amount: 5000, year: 2026, conversion_date: "2026-03-01", first_name: "John", last_name: "Doe" }]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        const result = await getLeaveReport(ADMIN, { ...baseFilters, reportType: "conversion" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].employee_name).toBe("John Doe");
      });

      it("adds branch filter for non-ADMIN", async () => {
        getUserBranchIds.mockResolvedValue([3]);
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getLeaveReport(NON_ADMIN, { ...baseFilters, reportType: "conversion" });
        expect(getUserBranchIds).toHaveBeenCalled();
      });
    });

    // --- Default / all leaves ---
    describe("default reportType (all leaves)", () => {
      it("returns all leaves with 1=1 condition", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", status: "PENDING" }]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        const result = await getLeaveReport(ADMIN, { ...baseFilters });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].employee_name).toBe("John Doe");
      });

      it("applies status filter in default path", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getLeaveReport(ADMIN, { ...baseFilters, status: "APPROVED" });
        expect(getSQL()).toMatch(/l\.status/);
        expect(getParams()).toContain("APPROVED");
      });
    });

    it("returns early when branchIds empty for non-ADMIN in usage", async () => {
      getUserBranchIds.mockResolvedValue([]);
      const result = await getLeaveReport(NON_ADMIN, { ...baseFilters, reportType: "usage" });
      expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    });

    it("returns early when branchIds empty for non-ADMIN in conversion", async () => {
      getUserBranchIds.mockResolvedValue([]);
      const result = await getLeaveReport(NON_ADMIN, { ...baseFilters, reportType: "conversion" });
      expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    });

    it("returns early when branchIds empty for non-ADMIN default", async () => {
      getUserBranchIds.mockResolvedValue([]);
      const result = await getLeaveReport(NON_ADMIN, { ...baseFilters });
      expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    });
  });

  // ==========================================
  // getAttendanceReport
  // ==========================================
  describe("getAttendanceReport", () => {
    const baseFilters = {};

    describe("reportType = monthly_summary", () => {
      it("returns monthly summary for ADMIN", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ month: "2026-01", present_count: 20, late_count: 2, absent_count: 1, half_day_count: 0, leave_count: 1, total_records: 24 }]))
          .mockResolvedValueOnce(mockRows([{ count: "3" }]));
        const result = await getAttendanceReport(ADMIN, { ...baseFilters, reportType: "monthly_summary" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].month).toBe("2026-01");
        expect(result.pagination.total).toBe(3);
      });

      it("returns early when branchIds empty for non-ADMIN", async () => {
        getUserBranchIds.mockResolvedValue([]);
        const result = await getAttendanceReport(NON_ADMIN, { ...baseFilters, reportType: "monthly_summary" });
        expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      });
    });

    describe("reportType = by_branch", () => {
      it("returns branch summary for ADMIN", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ branch_id: 1, branch_name: "Main", present_count: 50, total_records: 60 }]))
          .mockResolvedValueOnce(mockRows([{ count: "2" }]));
        const result = await getAttendanceReport(ADMIN, { ...baseFilters, reportType: "by_branch" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].branch_name).toBe("Main");
      });

      it("returns early when branchIds empty for non-ADMIN", async () => {
        getUserBranchIds.mockResolvedValue([]);
        const result = await getAttendanceReport(NON_ADMIN, { ...baseFilters, reportType: "by_branch" });
        expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      });
    });

    describe("reportType = by_department", () => {
      it("returns department summary", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ department: "IT", present_count: 30, total_records: 35 }]))
          .mockResolvedValueOnce(mockRows([{ count: "4" }]));
        const result = await getAttendanceReport(ADMIN, { ...baseFilters, reportType: "by_department" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].department).toBe("IT");
      });
    });

    describe("reportType = late", () => {
      it("filters by late status", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", status: "LATE" }]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        const result = await getAttendanceReport(ADMIN, { ...baseFilters, reportType: "late" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].employee_name).toBe("John Doe");
      });
    });

    describe("reportType = absent", () => {
      it("filters by absent status", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getAttendanceReport(ADMIN, { ...baseFilters, reportType: "absent" });
        expect(getParams()).toContain("ABSENT");
      });
    });

    describe("default reportType", () => {
      it("applies status filter when provided", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getAttendanceReport(ADMIN, { ...baseFilters, status: "PRESENT" });
        expect(getSQL()).toMatch(/a\.status/);
        expect(getParams()).toContain("PRESENT");
      });

      it("applies department and search filters", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getAttendanceReport(ADMIN, { ...baseFilters, department: "IT", search: "john" });
        expect(getSQL()).toMatch(/e\.department/);
        const params = getParams();
        expect(params).toContain("IT");
        expect(params).toContain("%john%");
      });
    });

    it("returns early when branchIds empty for non-ADMIN in default path", async () => {
      getUserBranchIds.mockResolvedValue([]);
      const result = await getAttendanceReport(NON_ADMIN, { ...baseFilters });
      expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    });

    it("adds branch filter for non-ADMIN in default path", async () => {
      getUserBranchIds.mockResolvedValue([1, 2]);
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getAttendanceReport(NON_ADMIN, { ...baseFilters });
      expect(getUserBranchIds).toHaveBeenCalled();
      expect(getSQL()).toMatch(/e\.branch_id = ANY/);
    });
  });

  // ==========================================
  // getPayrollReport
  // ==========================================
  describe("getPayrollReport", () => {
    const baseFilters = {};

    describe("reportType = by_branch", () => {
      it("returns payroll by branch for ADMIN", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ branch_id: 1, branch_name: "Main", total_employees: 10, total_net_salary: 500000, total_deductions: 50000, total_overtime: 20000, total_basic_salary: 450000 }]))
          .mockResolvedValueOnce(mockRows([{ count: "2" }]));
        const result = await getPayrollReport(ADMIN, { ...baseFilters, reportType: "by_branch" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].branch_name).toBe("Main");
      });

      it("returns early when branchIds empty for non-ADMIN", async () => {
        getUserBranchIds.mockResolvedValue([]);
        const result = await getPayrollReport(NON_ADMIN, { ...baseFilters, reportType: "by_branch" });
        expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      });
    });

    describe("reportType = by_department / department_summary", () => {
      it("returns payroll by department for ADMIN", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ department: "IT", total_employees: 5, total_net_salary: 300000 }]))
          .mockResolvedValueOnce(mockRows([{ count: "3" }]));
        const result = await getPayrollReport(ADMIN, { ...baseFilters, reportType: "by_department" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].department).toBe("IT");
      });

      it("handles department_summary alias", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getPayrollReport(ADMIN, { ...baseFilters, reportType: "department_summary" });
        expect(getSQL()).toMatch(/GROUP BY e\.department/);
      });
    });

    describe("reportType = net_pay_summary", () => {
      it("returns net pay details", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", net_salary: 25000, basic_salary: 30000, deductions: 5000 }]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        const result = await getPayrollReport(ADMIN, { ...baseFilters, reportType: "net_pay_summary" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].employee_name).toBe("John Doe");
      });
    });

    describe("reportType = deduction_summary", () => {
      it("returns deduction details", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", total_deductions: 5000, late_deduction: 500, government_deduction: 2000 }]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        const result = await getPayrollReport(ADMIN, { ...baseFilters, reportType: "deduction_summary" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].employee_name).toBe("John Doe");
      });
    });

    describe("reportType = final_pay", () => {
      it("returns final pay records", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ id: 1, employee_id: 1, total_amount: 50000, fp_status: "Pending", first_name: "John", last_name: "Doe" }]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        const result = await getPayrollReport(ADMIN, { ...baseFilters, reportType: "final_pay" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].employee_name).toBe("John Doe");
      });
    });

    describe("reportType = paid/unpaid/summary", () => {
      it("reportType = paid adds PAID status filter", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getPayrollReport(ADMIN, { ...baseFilters, reportType: "paid" });
        expect(getParams()).toContain("PAID");
      });

      it("reportType = unpaid adds UNPAID status filter", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getPayrollReport(ADMIN, { ...baseFilters, reportType: "unpaid" });
        expect(getParams()).toContain("UNPAID");
      });

      it("reportType = summary works as default", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getPayrollReport(ADMIN, { ...baseFilters, reportType: "summary" });
        expect(pool.query).toHaveBeenCalled();
      });

      it("applies all optional filters in summary path", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getPayrollReport(ADMIN, {
          ...baseFilters, reportType: "summary",
          branch_id: 2, department: "IT", cutoffStart: "2026-01-01", cutoffEnd: "2026-01-15",
          payDate: "2026-01-20", status: "PAID", search: "john",
        });
        expect(getSQL()).toMatch(/p\.cutoff_start/);
      });
    });
  });

  // ==========================================
  // getBenefitsReport
  // ==========================================
  describe("getBenefitsReport", () => {
    const baseFilters = {};

    it("returns deductions data for ADMIN", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", type: "SSS", amount: 1200, is_active: true }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await getBenefitsReport(ADMIN, baseFilters);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].employee_name).toBe("John Doe");
    });

    it("filters by deductionType", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getBenefitsReport(ADMIN, { ...baseFilters, deductionType: "SSS" });
      expect(getSQL()).toMatch(/d\.type/);
      expect(getParams()).toContain("SSS");
    });

    it("reportType = government excludes LATE types", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getBenefitsReport(ADMIN, { ...baseFilters, reportType: "government" });
      expect(getSQL()).toMatch(/NOT LIKE 'LATE%'/);
    });

    it("reportType = sss filters by SSS", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getBenefitsReport(ADMIN, { ...baseFilters, reportType: "sss" });
      expect(getParams()).toContain("SSS");
    });

    it("reportType = philhealth filters by PHILHEALTH", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getBenefitsReport(ADMIN, { ...baseFilters, reportType: "philhealth" });
      expect(getParams()).toContain("PHILHEALTH");
    });

    it("reportType = pagibig filters by PAGIBIG", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getBenefitsReport(ADMIN, { ...baseFilters, reportType: "pagibig" });
      expect(getParams()).toContain("PAGIBIG");
    });

    it("reportType = tax filters by TAX", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getBenefitsReport(ADMIN, { ...baseFilters, reportType: "tax" });
      expect(getParams()).toContain("TAX");
    });

    it("reportType = loan_other filters by LOAN or OTHER", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getBenefitsReport(ADMIN, { ...baseFilters, reportType: "loan_other" });
      expect(getParams()).toContain("LOAN");
      expect(getParams()).toContain("OTHER");
    });

    it("unknown reportType excludes LATE types", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getBenefitsReport(ADMIN, { ...baseFilters, reportType: "unknown_type" });
      expect(getSQL()).toMatch(/NOT LIKE 'LATE%'/);
    });

    it("filters by status = active", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getBenefitsReport(ADMIN, { ...baseFilters, status: "active" });
      expect(getSQL()).toMatch(/d\.is_active/);
      expect(getParams()).toContain(true);
    });

    it("filters by status = inactive", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getBenefitsReport(ADMIN, { ...baseFilters, status: "inactive" });
      expect(getSQL()).toMatch(/d\.is_active/);
      expect(getParams()).toContain(false);
    });

    it("returns early when branchIds empty for non-ADMIN", async () => {
      getUserBranchIds.mockResolvedValue([]);
      const result = await getBenefitsReport(NON_ADMIN, baseFilters);
      expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("applies department, branch_id, search filters", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await getBenefitsReport(ADMIN, { ...baseFilters, department: "IT", branch_id: 2, search: "john" });
      expect(getSQL()).toMatch(/e\.department/);
      const params = getParams();
      expect(params).toContain("IT");
      expect(params).toContain(2);
      expect(params).toContain("%john%");
    });
  });

  // ==========================================
  // getPerformanceReport
  // ==========================================
  describe("getPerformanceReport", () => {
    const baseFilters = {};

    it("returns early when branchIds empty for non-ADMIN", async () => {
      getUserBranchIds.mockResolvedValue([]);
      const result = await getPerformanceReport(NON_ADMIN, { ...baseFilters, reportType: "summary" });
      expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    });

    describe("reportType = completed", () => {
      it("filters by Approved status", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", status: "Approved", final_score: 85 }]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        const result = await getPerformanceReport(ADMIN, { ...baseFilters, reportType: "completed" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].employee_name).toBe("John Doe");
      });
    });

    describe("reportType = pending", () => {
      it("filters by Draft/In Progress/Submitted", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getPerformanceReport(ADMIN, { ...baseFilters, reportType: "pending" });
        const params = getParams();
        expect(params).toContain("Draft");
        expect(params).toContain("In Progress");
        expect(params).toContain("Submitted");
      });
    });

    describe("reportType = by_department", () => {
      it("returns department performance summary", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{ department: "IT", total_evaluations: 10, avg_score: 85.5, completed_count: 7, pending_count: 3 }]))
          .mockResolvedValueOnce(mockRows([{ count: "3" }]));
        const result = await getPerformanceReport(ADMIN, { ...baseFilters, reportType: "by_department", department: "IT" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].department).toBe("IT");
        expect(result.data[0].avg_score).toBe(85.5);
      });
    });

    describe("reportType = completion_rate", () => {
      it("returns completion rate", async () => {
        pool.query.mockResolvedValueOnce(mockRows([{ total_evaluations: 20, completed_count: 15, submitted_count: 3, in_progress_count: 1, draft_count: 1 }]));
        const result = await getPerformanceReport(ADMIN, { ...baseFilters, reportType: "completion_rate" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].completion_rate).toBe(75);
        expect(result.pagination.total).toBe(1);
      });

      it("returns 0 completion rate when no evaluations", async () => {
        pool.query.mockResolvedValueOnce(mockRows([{ total_evaluations: 0, completed_count: 0, submitted_count: 0, in_progress_count: 0, draft_count: 0 }]));
        const result = await getPerformanceReport(ADMIN, { ...baseFilters, reportType: "completion_rate" });
        expect(result.data[0].completion_rate).toBe(0);
      });
    });

    describe("reportType = summary (default)", () => {
      it("returns full performance summary with joins", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{
            id: 1, employee_id: 1, status: "Approved", final_score: 90,
            first_name: "John", last_name: "Doe", employee_code: "E001",
            department: "IT", branch_name: "Main", template_name: "Q1 Review",
            evaluator_first_name: "Jane", evaluator_last_name: "Smith",
          }]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        const result = await getPerformanceReport(ADMIN, { ...baseFilters, reportType: "summary" });
        expect(result.data).toHaveLength(1);
        expect(result.data[0].employee_name).toBe("John Doe");
        expect(result.data[0].evaluator_name).toBe("Jane Smith");
      });

      it("handles null evaluator", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([{
            id: 1, employee_id: 1, status: "Approved", final_score: 90,
            first_name: "John", last_name: "Doe", employee_code: "E001",
            department: "IT", branch_name: "Main", template_name: null,
            evaluator_first_name: null, evaluator_last_name: null,
          }]))
          .mockResolvedValueOnce(mockRows([{ count: "1" }]));
        const result = await getPerformanceReport(ADMIN, { ...baseFilters, reportType: "summary" });
        expect(result.data[0].evaluator_name).toBeNull();
      });

      it("applies filters in summary path", async () => {
        pool.query
          .mockResolvedValueOnce(mockRows([]))
          .mockResolvedValueOnce(mockRows([{ count: "0" }]));
        await getPerformanceReport(ADMIN, {
          ...baseFilters, reportType: "summary",
          status: "Approved", department: "IT", branch_id: 2,
          startDate: "2026-01-01", endDate: "2026-06-30", search: "john",
        });
        expect(getSQL()).toMatch(/evaluation_period_start/);
      });
    });
  });

  // ==========================================
  // exportReport
  // ==========================================
  describe("exportReport", () => {
    it("delegates to getEmployeeReport for employees category", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", employee_code: "E001" }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await exportReport(ADMIN, { reportCategory: "employees", reportType: "active" });
      expect(result.filename).toContain("employees_active_");
      expect(result.count).toBe(1);
      expect(result.csv).toContain("employee_code");
    });

    it("delegates to getLeaveReport for leaves category", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", type: "VL", from_date: "2026-01-15", to_date: "2026-01-15", status: "APPROVED" }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await exportReport(ADMIN, { reportCategory: "leaves", reportType: "usage" });
      expect(result.count).toBe(1);
    });

    it("delegates to getAttendanceReport for attendance category", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", status: "LATE", date: "2026-01-15" }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await exportReport(ADMIN, { reportCategory: "attendance", reportType: "late" });
      expect(result.count).toBe(1);
    });

    it("delegates to getPayrollReport for payroll category", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", net_salary: 25000 }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await exportReport(ADMIN, { reportCategory: "payroll", reportType: "summary" });
      expect(result.count).toBe(1);
    });

    it("delegates to getBenefitsReport for benefits category", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", type: "SSS", amount: 1200 }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await exportReport(ADMIN, { reportCategory: "benefits", reportType: "deductions" });
      expect(result.count).toBe(1);
    });

    it("delegates to getPerformanceReport for performance category", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe", status: "Approved", final_score: 90 }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await exportReport(ADMIN, { reportCategory: "performance", reportType: "completed" });
      expect(result.count).toBe(1);
    });

    it("returns empty csv when no data", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      const result = await exportReport(ADMIN, { reportCategory: "employees", reportType: "active" });
      expect(result.csv).toBe("");
      expect(result.count).toBe(0);
    });

    it("throws for invalid report category", async () => {
      await expect(exportReport(ADMIN, { reportCategory: "invalid", reportType: "foo" }))
        .rejects.toThrow("Invalid report category: invalid");
    });

    it("escapes CSV fields with commas or quotes", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: "Doe, Jr.", employee_code: "E001", note: 'he said "hello"' }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await exportReport(ADMIN, { reportCategory: "employees", reportType: "active" });
      expect(result.csv).toContain('"Doe, Jr."');
      expect(result.csv).toContain('"he said ""hello"""');
    });

    it("handles null/undefined values in CSV", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([{ id: 1, first_name: "John", last_name: null, employee_code: "E001", middle_name: undefined }]))
        .mockResolvedValueOnce(mockRows([{ count: "1" }]));
      const result = await exportReport(ADMIN, { reportCategory: "employees", reportType: "active" });
      expect(result.count).toBe(1);
    });

    it("passes limit=10000 to sub-functions", async () => {
      pool.query
        .mockResolvedValueOnce(mockRows([]))
        .mockResolvedValueOnce(mockRows([{ count: "0" }]));
      await exportReport(ADMIN, { reportCategory: "employees", reportType: "master_list" });
      expect(getSQL()).toMatch(/LIMIT/);
      expect(getParams()).toContain(10000);
    });
  });
});
