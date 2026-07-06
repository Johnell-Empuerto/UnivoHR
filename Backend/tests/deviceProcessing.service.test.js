jest.mock("../config/db", () => {
  const mClient = { query: jest.fn(), release: jest.fn() };
  return { query: jest.fn(), connect: jest.fn().mockResolvedValue(mClient) };
});
jest.mock("../models/rawLogs.model", () => ({
  updateStatus: jest.fn(), incrementRetry: jest.fn(),
  startProcessing: jest.fn(), getByIdWithDevice: jest.fn(),
}));
jest.mock("../models/employeeDeviceUser.model", () => ({ getByDeviceAndUserId: jest.fn() }));
jest.mock("../services/attendance.service", () => ({ createAttendance: jest.fn() }));

const pool = require("../config/db");
const rawLogsModel = require("../models/rawLogs.model");
const employeeDeviceUserModel = require("../models/employeeDeviceUser.model");
const attendanceService = require("../services/attendance.service");
const { processSingleLog, processNextBatch, drainQueue } = require("../services/deviceProcessing.service");

describe("deviceProcessing.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("processSingleLog", () => {
    it("returns null when log cannot be claimed", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await processSingleLog(1);
      expect(result).toBeNull();
    });

    it("processes a single log successfully", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, employee_code: "EMP001", raw_payload: '{"employee_code":"EMP001"}', device_id: 1, timestamp: "2026-01-01T08:00:00" }] });
      rawLogsModel.getByIdWithDevice.mockResolvedValue({ id: 1, device_id: 1, raw_payload: '{"employee_code":"EMP001"}', device_type: "OTHER", employee_code: null, timestamp: "2026-01-01T08:00:00" });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 42 }] });
      attendanceService.createAttendance.mockResolvedValue({ id: 99 });
      const client = await pool.connect();
      client.query.mockResolvedValue({ rows: [] });

      await processSingleLog(1);
      expect(client.query).toHaveBeenCalledWith("BEGIN");
      expect(client.query).toHaveBeenCalledWith("COMMIT");
    });

    it("marks as failed on error", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      rawLogsModel.getByIdWithDevice.mockRejectedValue(new Error("Processing error"));
      await expect(processSingleLog(1)).rejects.toThrow("Processing error");
      expect(rawLogsModel.updateStatus).toHaveBeenCalledWith(1, "FAILED", "Processing error");
      expect(rawLogsModel.incrementRetry).toHaveBeenCalledWith(1);
    });
  });

  describe("processNextBatch", () => {
    it("processes a batch of logs", async () => {
      const rawLog = { id: 1, employee_code: "EMP001", raw_payload: '{"employee_code":"EMP001"}', device_id: 1, timestamp: "2026-01-01T08:00:00" };
      rawLogsModel.startProcessing.mockResolvedValue([rawLog]);
      rawLogsModel.getByIdWithDevice.mockResolvedValue({ id: 1, device_id: 1, raw_payload: '{"employee_code":"EMP001"}', device_type: "OTHER", employee_code: null, timestamp: "2026-01-01T08:00:00" });
      pool.query.mockResolvedValue({ rows: [{ id: 42 }] });
      attendanceService.createAttendance.mockResolvedValue({});
      const client = await pool.connect();
      client.query.mockResolvedValue({ rows: [] });

      const count = await processNextBatch(10);
      expect(count).toBe(1);
    });

    it("handles errors in batch gracefully", async () => {
      rawLogsModel.startProcessing.mockResolvedValue([{ id: 1 }]);
      rawLogsModel.getByIdWithDevice.mockRejectedValue(new Error("Fail"));
      const count = await processNextBatch(10);
      expect(count).toBe(1);
      expect(rawLogsModel.updateStatus).toHaveBeenCalledWith(1, "FAILED", "Fail");
    });
  });

  describe("drainQueue", () => {
    it("drains all pending logs", async () => {
      const rawLog = { id: 1, employee_code: "EMP001", raw_payload: '{"employee_code":"EMP001"}', device_id: 1, timestamp: "2026-01-01T08:00:00" };
      rawLogsModel.startProcessing.mockResolvedValueOnce([rawLog]).mockResolvedValueOnce([]);
      rawLogsModel.getByIdWithDevice.mockResolvedValue({ id: 1, device_id: 1, raw_payload: '{"employee_code":"EMP001"}', device_type: "OTHER", employee_code: null, timestamp: "2026-01-01T08:00:00" });
      pool.query.mockResolvedValue({ rows: [{ id: 42 }] });
      attendanceService.createAttendance.mockResolvedValue({});
      const client = await pool.connect();
      client.query.mockResolvedValue({ rows: [] });

      const total = await drainQueue();
      expect(total).toBe(1);
    });
  });
});
