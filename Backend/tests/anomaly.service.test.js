jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../models/anomaly.model", () => ({
  findExistingOpenAnomaly: jest.fn(),
  createAnomaly: jest.fn(),
}));
jest.mock("../services/notification.service", () => ({ notify: jest.fn() }));
jest.mock("../services/audit.service", () => ({ auditLog: jest.fn() }));
jest.mock("../services/notificationRule.service", () => ({ getRuleByKey: jest.fn() }));
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));

const pool = require("../config/db");
const {
  detectAttendanceAnomalies,
  runDailyAnomalyScan,
  runWeeklyAnomalyScan,
} = require("../services/anomaly.service");

describe("anomaly.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("detectAttendanceAnomalies", () => {
    const mockReq = { ip: "127.0.0.1", user: { id: 1 } };

    it("returns zeros when no anomalies detected", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const { getRuleByKey } = require("../services/notificationRule.service");
      getRuleByKey.mockResolvedValue({ is_enabled: false });

      const result = await detectAttendanceAnomalies(mockReq);
      expect(result).toEqual({ detected: 0, errors: 0 });
    });

    it("returns result shape when query returns data", async () => {
      const { getRuleByKey } = require("../services/notificationRule.service");
      getRuleByKey.mockResolvedValue({ is_enabled: true, threshold_count: 3, threshold_days: 7 });
      const { findExistingOpenAnomaly } = require("../models/anomaly.model");
      findExistingOpenAnomaly.mockResolvedValue(null);
      const { createAnomaly } = require("../models/anomaly.model");
      createAnomaly.mockResolvedValue({ id: 1 });
      pool.query.mockResolvedValue({ rows: [{ employee_id: 1, branch_id: 1, late_count: 5 }] });

      const result = await detectAttendanceAnomalies(mockReq);
      expect(result).toHaveProperty("detected");
      expect(result).toHaveProperty("errors");
    });
  });

  describe("runDailyAnomalyScan", () => {
    it("runs daily scan and returns result shape", async () => {
      const { getRuleByKey } = require("../services/notificationRule.service");
      getRuleByKey.mockResolvedValue({ is_enabled: false });
      pool.query.mockResolvedValue({ rows: [] });

      const result = await runDailyAnomalyScan(null);
      expect(result).toHaveProperty("attendance");
      expect(result).toHaveProperty("overtime");
      expect(result).toHaveProperty("leaves");
      expect(result).toHaveProperty("time_modification");
      expect(result).toHaveProperty("man_hours");
      expect(result).toHaveProperty("total_detected");
    });
  });

  describe("runWeeklyAnomalyScan", () => {
    it("runs weekly scan and returns result shape", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await runWeeklyAnomalyScan(null);
      expect(result).toHaveProperty("payroll");
      expect(result).toHaveProperty("total_detected");
    });
  });
});
