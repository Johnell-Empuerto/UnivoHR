jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));

const pool = require("../config/db");
const {
  forecastAttendance,
  forecastPayroll,
  forecastOvertime,
  forecastAbsenteeism,
  getForecastHistory,
  getLatestForecasts,
  getForecastAccuracy,
  runAllForecasts,
  forecastByBranch,
  updateActualValue,
} = require("../services/forecast.service");

describe("forecast.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateActualValue", () => {
    it("updates and returns actual value", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, actual_value: 85 }] });
      const result = await updateActualValue(1, 85);
      expect(result.actual_value).toBe(85);
    });
  });

  describe("getForecastHistory", () => {
    it("returns paginated history", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, metric_name: "attendance_rate" }] })
        .mockResolvedValueOnce({ rows: [{ count: "1" }] });
      const result = await getForecastHistory({ metric_name: "attendance_rate" });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("getLatestForecasts", () => {
    it("returns latest forecasts", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, metric_name: "attendance_rate" }] });
      const result = await getLatestForecasts({ metric_name: "attendance_rate" });
      expect(result).toHaveLength(1);
    });
  });

  describe("getForecastAccuracy", () => {
    it("returns accuracy data", async () => {
      pool.query.mockResolvedValue({ rows: [{ metric_name: "attendance_rate", avg_accuracy: "0.9" }] });
      const result = await getForecastAccuracy({ metric_name: "attendance_rate" });
      expect(result[0].avg_accuracy).toBe("0.9");
    });
  });

  describe("forecastAttendance", () => {
    it("returns empty when insufficient data (< 7 rows)", async () => {
      pool.query.mockResolvedValue({ rows: [{ date: "2024-01-01", rate: "0.5" }] });
      const result = await forecastAttendance();
      expect(result).toEqual([]);
    });
  });

  describe("forecastPayroll", () => {
    it("returns empty when insufficient data (< 3 rows)", async () => {
      pool.query.mockResolvedValue({ rows: [{ cutoff_end: "2024-01-15", total_payroll: "10000" }] });
      const result = await forecastPayroll();
      expect(result).toEqual([]);
    });
  });

  describe("forecastOvertime", () => {
    it("returns empty when insufficient data (< 4 rows)", async () => {
      pool.query.mockResolvedValue({ rows: [{ week: "2024-01-07", total_hours: 10 }] });
      const result = await forecastOvertime();
      expect(result).toEqual([]);
    });
  });

  describe("forecastAbsenteeism", () => {
    it("returns empty when insufficient data (< 4 rows)", async () => {
      pool.query.mockResolvedValue({ rows: [{ week: "2024-01-07", absence_rate: "0.1" }] });
      const result = await forecastAbsenteeism();
      expect(result).toEqual([]);
    });
  });

  describe("runAllForecasts", () => {
    it("runs all forecasts returning empty results", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await runAllForecasts();
      expect(result.attendance).toEqual([]);
      expect(result.payroll).toEqual([]);
      expect(result.overtime).toEqual([]);
      expect(result.absenteeism).toEqual([]);
    });
  });

  describe("forecastByBranch", () => {
    it("returns empty when no active branches", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await forecastByBranch();
      expect(result).toEqual([]);
    });
  });
});
