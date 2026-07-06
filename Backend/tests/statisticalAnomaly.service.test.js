jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../models/anomaly.model", () => ({
  findExistingOpenAnomaly: jest.fn(),
  createAnomaly: jest.fn(),
}));
jest.mock("../services/notification.service", () => ({ notify: jest.fn() }));
jest.mock("../services/notificationRule.service", () => ({
  getRuleByKey: jest.fn(),
}));
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));

const pool = require("../config/db");
const anomalyModel = require("../models/anomaly.model");
const notificationRuleService = require("../services/notificationRule.service");
const {
  detectStatisticalAttendanceAnomalies,
  detectStatisticalBranchAnomalies,
  runDailyStatisticalScan,
  runWeeklyStatisticalScan,
} = require("../services/statisticalAnomaly.service");

describe("statisticalAnomaly.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("detectStatisticalAttendanceAnomalies", () => {
    it("returns zeros when rule defaults disabled", async () => {
      notificationRuleService.getRuleByKey.mockResolvedValue({ is_enabled: false });
      const result = await detectStatisticalAttendanceAnomalies();
      expect(result).toEqual({ detected: 0, errors: 0 });
    });

    it("returns zeros with insufficient data", async () => {
      notificationRuleService.getRuleByKey.mockResolvedValue({ is_enabled: true, threshold_days: 30, threshold_count: 2 });
      pool.query.mockResolvedValue({ rows: [] });
      const result = await detectStatisticalAttendanceAnomalies();
      expect(result).toEqual({ detected: 0, errors: 0 });
    });
  });

  describe("detectStatisticalBranchAnomalies", () => {
    it("returns zeros when no branch data", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await detectStatisticalBranchAnomalies();
      expect(result).toEqual({ detected: 0, errors: 0 });
    });
  });

  describe("runDailyStatisticalScan", () => {
    it("runs all daily scans and returns result shape", async () => {
      notificationRuleService.getRuleByKey.mockResolvedValue({ is_enabled: false });
      pool.query.mockResolvedValue({ rows: [] });
      const result = await runDailyStatisticalScan();
      expect(result).toHaveProperty("attendance");
      expect(result).toHaveProperty("overtime");
      expect(result).toHaveProperty("leaves");
      expect(result).toHaveProperty("branch");
      expect(result).toHaveProperty("total_detected");
    });
  });

  describe("runWeeklyStatisticalScan", () => {
    it("runs weekly scan and returns zeros", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await runWeeklyStatisticalScan();
      expect(result).toHaveProperty("payroll");
      expect(result.total_detected).toBe(0);
    });
  });
});
