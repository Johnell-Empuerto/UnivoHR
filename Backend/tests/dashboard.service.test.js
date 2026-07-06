jest.mock("../models/dashboard.model", () => ({
  getSummary: jest.fn(),
  getMySummary: jest.fn(),
  getTodayStatus: jest.fn(),
  getAdminAnalytics: jest.fn(),
  getMonthlyComparison: jest.fn(),
  getMyMonthlyComparison: jest.fn(),
  getPayrollSummary: jest.fn(),
  getPayrollTrend: jest.fn(),
  getDeptComparison: jest.fn(),
}));

const dashboardModel = require("../models/dashboard.model");
const {
  getSummary, getMySummary, getTodayStatus,
  getAdminAnalytics, calculateInsights, getMyAnalytics, getExecutiveKpis,
} = require("../services/dashboard.service");

describe("dashboard.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateInsights", () => {
    it("returns warning when attendance is critically low", () => {
      const result = calculateInsights({ present: 3, late: 1, absent: 5, on_leave: 1 });
      expect(result.attendanceRate).toBe("40.0");
      expect(result.insights[0].type).toBe("warning");
    });

    it("returns success for healthy attendance", () => {
      const result = calculateInsights({ present: 50, late: 5, absent: 2, on_leave: 3 });
      expect(Number(result.attendanceRate)).toBeGreaterThan(90);
      expect(result.insights[0].type).toBe("success");
    });

    it("includes trend insights when trends are provided", () => {
      const result = calculateInsights({ present: 10, late: 1, absent: 2, on_leave: 1 }, { absent: 10 });
      const trendInsights = result.insights.filter(i => i.message.includes("increased"));
      expect(trendInsights.length).toBeGreaterThan(0);
    });

    it("returns healthy level message for mid-range attendance", () => {
      const result = calculateInsights({ present: 17, late: 0, absent: 1, on_leave: 2 });
      expect(result.insights[0].message).toBe("Attendance is at a healthy level.");
    });
  });

  describe("getSummary", () => {
    it("returns summary from model", async () => {
      dashboardModel.getSummary.mockResolvedValue({ present: 10, late: 1 });
      const result = await getSummary([1, 2], "2024-01-01", "2024-01-31");
      expect(result.present).toBe(10);
      expect(dashboardModel.getSummary).toHaveBeenCalledWith([1, 2], "2024-01-01", "2024-01-31");
    });
  });

  describe("getMySummary", () => {
    it("returns my summary from model", async () => {
      dashboardModel.getMySummary.mockResolvedValue({ present: 5, late: 0 });
      const result = await getMySummary(1);
      expect(result.present).toBe(5);
    });
  });

  describe("getTodayStatus", () => {
    it("returns today status from model", async () => {
      dashboardModel.getTodayStatus.mockResolvedValue({ status: "PRESENT" });
      const result = await getTodayStatus(1);
      expect(result.status).toBe("PRESENT");
    });
  });

  describe("getAdminAnalytics", () => {
    it("returns combined analytics with insights", async () => {
      dashboardModel.getAdminAnalytics.mockResolvedValue({ daily_breakdown: [] });
      dashboardModel.getSummary.mockResolvedValue({ present: 10, late: 1, absent: 2, on_leave: 1 });
      dashboardModel.getMonthlyComparison.mockResolvedValue([{}, {}]);

      const result = await getAdminAnalytics([1], "2024-01-01", "2024-01-31");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("trends");
      expect(result).toHaveProperty("insights");
      expect(result).toHaveProperty("metrics");
    });
  });

  describe("getMyAnalytics", () => {
    it("returns my analytics with insights", async () => {
      dashboardModel.getMySummary.mockResolvedValue({ present: 5, late: 0, absent: 0, on_leave: 0 });
      dashboardModel.getMyMonthlyComparison.mockResolvedValue([{}, {}]);

      const result = await getMyAnalytics(1);
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("trends");
      expect(result).toHaveProperty("insights");
    });
  });

  describe("getExecutiveKpis", () => {
    it("returns KPIs from models", async () => {
      dashboardModel.getPayrollSummary.mockResolvedValue({ total: 10000 });
      dashboardModel.getPayrollTrend.mockResolvedValue([]);
      dashboardModel.getDeptComparison.mockResolvedValue([]);

      const result = await getExecutiveKpis([1], "2024-01-01", "2024-01-31");
      expect(result).toHaveProperty("payroll");
      expect(result).toHaveProperty("payroll_trend");
      expect(result).toHaveProperty("department_breakdown");
    });
  });
});
