jest.mock("../models/rawLogs.model", () => ({ insertLog: jest.fn(), bulkInsert: jest.fn() }));
jest.mock("../models/device.model", () => ({ getById: jest.fn(), updateLastConnected: jest.fn() }));
jest.mock("../services/deviceProcessing.queue", () => ({ safeAddLog: jest.fn(), safeAddBatch: jest.fn() }));

const rawLogsModel = require("../models/rawLogs.model");
const deviceModel = require("../models/device.model");
const deviceProcessingQueue = require("../services/deviceProcessing.queue");
const { validateDevice, pushLog, importFile, applyMappings } = require("../services/deviceIntegration.service");

describe("deviceIntegration.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("validateDevice", () => {
    it("returns device when active", async () => {
      deviceModel.getById.mockResolvedValue({ id: 1, status: "ACTIVE" });
      expect(await validateDevice(1)).toEqual({ id: 1, status: "ACTIVE" });
    });
    it("throws when device not found", async () => {
      deviceModel.getById.mockResolvedValue(null);
      await expect(validateDevice(1)).rejects.toThrow("Device not found");
    });
    it("throws when device inactive", async () => {
      deviceModel.getById.mockResolvedValue({ id: 1, status: "INACTIVE" });
      await expect(validateDevice(1)).rejects.toThrow("Device is not active");
    });
  });

  describe("pushLog", () => {
    it("validates, inserts, and queues a log", async () => {
      deviceModel.getById.mockResolvedValue({ id: 1, status: "ACTIVE" });
      rawLogsModel.insertLog.mockResolvedValue({ id: 10 });
      const result = await pushLog(1, { data: "test" });
      expect(result.id).toBe(10);
      expect(deviceModel.updateLastConnected).toHaveBeenCalledWith(1);
      expect(deviceProcessingQueue.safeAddLog).toHaveBeenCalledWith(10, expect.any(Function));
    });
  });

  describe("importFile", () => {
    it("inserts logs and queues batch", async () => {
      rawLogsModel.bulkInsert.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const rows = [{ employee_code: "EMP001", timestamp: "2026-01-01T08:00:00" }];
      const result = await importFile(rows, 1, "batch-1");
      expect(result).toHaveLength(2);
      expect(deviceProcessingQueue.safeAddBatch).toHaveBeenCalledWith([1, 2], expect.any(Function));
    });

    it("handles various payload field names", async () => {
      rawLogsModel.bulkInsert.mockResolvedValue([{ id: 1 }]);
      const rows = [{ employeeId: "EMP002", date_time: "2026-01-02T09:00:00" }];
      const result = await importFile(rows, null);
      expect(result).toHaveLength(1);
    });
  });

  describe("applyMappings", () => {
    it("maps fields from payload", () => {
      const result = applyMappings({ name: "John", id: "123" }, [
        { field_source: "name", field_target: "full_name", active: true },
        { field_source: "id", field_target: "employee_id", active: true },
        { field_source: "nonexistent", field_target: "other", active: true },
      ]);
      expect(result).toEqual({ full_name: "John", employee_id: "123" });
    });

    it("skips inactive mappings", () => {
      const result = applyMappings({ name: "John" }, [
        { field_source: "name", field_target: "full_name", active: false },
      ]);
      expect(result).toEqual({});
    });

    it("handles string payload", () => {
      const result = applyMappings('{"name":"John"}', [
        { field_source: "name", field_target: "full_name", active: true },
      ]);
      expect(result.full_name).toBe("John");
    });

    it("handles invalid JSON string payload", () => {
      const result = applyMappings("not-json", [
        { field_source: "raw", field_target: "raw_data", active: true },
      ]);
      expect(result.raw_data).toBe("not-json");
    });
  });
});
