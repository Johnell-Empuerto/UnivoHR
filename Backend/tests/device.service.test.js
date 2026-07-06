jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../models/rawLogs.model", () => ({ insertLog: jest.fn() }));
jest.mock("../config/socket", () => ({ getIO: jest.fn() }));
jest.mock("../services/attendance.service", () => ({ createAttendance: jest.fn() }));

const pool = require("../config/db");
const rawLogsModel = require("../models/rawLogs.model");
const { getIO } = require("../config/socket");
const attendanceService = require("../services/attendance.service");
const { processLogs } = require("../services/device.service");

describe("device.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("processes a biometric log successfully", async () => {
    rawLogsModel.insertLog.mockResolvedValue({ id: 1 });
    pool.query.mockResolvedValue({ rows: [{ id: 42 }] });
    attendanceService.createAttendance.mockResolvedValue({ id: 99, status: "PRESENT" });
    const io = { emit: jest.fn() };
    getIO.mockReturnValue(io);

    const result = await processLogs({
      employee_code: "EMP001",
      timestamp: "2026-01-01T08:00:00",
      device_id: "DEV1",
    });

    expect(result.message).toBe("Log processed");
    expect(result.attendance.status).toBe("PRESENT");
    expect(rawLogsModel.insertLog).toHaveBeenCalled();
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("employee_code"), ["EMP001"],
    );
    expect(attendanceService.createAttendance).toHaveBeenCalledWith({
      employee_id: 42, timestamp: "2026-01-01T08:00:00", source: "BIOMETRIC", device_id: "DEV1",
    });
    expect(io.emit).toHaveBeenCalledWith("attendance-update", expect.any(Object));
  });

  it("throws when employee not found", async () => {
    rawLogsModel.insertLog.mockResolvedValue({ id: 1 });
    pool.query.mockResolvedValue({ rows: [] });
    await expect(processLogs({ employee_code: "UNKNOWN", timestamp: "2026-01-01T08:00:00" }))
      .rejects.toThrow("Employee not found");
  });
});
