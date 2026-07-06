jest.mock("../models/leave.model");
jest.mock("../models/attendance.model");
jest.mock("../models/leaveCredit.model");
jest.mock("../config/db");
jest.mock("../services/smtp.service");
jest.mock("../services/notificationHelper.service");
jest.mock("../services/notificationDispatch.service");
jest.mock("../services/emailTemplate.service");
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));

const leaveModel = require("../models/leave.model");
const attendanceModel = require("../models/attendance.model");
const leaveCreditModel = require("../models/leaveCredit.model");
const pool = require("../config/db");
const smtpService = require("../services/smtp.service");
const notificationHelper = require("../services/notificationHelper.service");
const notificationDispatch = require("../services/notificationDispatch.service");
const emailTemplateService = require("../services/emailTemplate.service");
const logger = require("../utils/logger");

let leaveService;
let mockClient;

const buildLeave = (overrides = {}) => ({
  id: 1,
  employee_id: 1,
  type: "SICK",
  from_date: "2024-03-01",
  to_date: "2024-03-03",
  reason: "Medical appointment",
  status: "PENDING",
  day_fraction: 1,
  half_day_type: null,
  employee_name: null,
  first_name: "John",
  last_name: "Doe",
  created_at: new Date("2024-03-01").toISOString(),
  ...overrides,
});

const buildLeaveWithName = (overrides = {}) => buildLeave({
  employee_name: "John Doe",
  employee_code: "EMP001",
  ...overrides,
});

const buildEmployee = (overrides = {}) => ({
  id: 1,
  first_name: "John",
  last_name: "Doe",
  middle_name: "",
  suffix: "",
  employee_code: "EMP001",
  email: "john@example.com",
  ...overrides,
});

beforeAll(() => {
  leaveService = require("../services/leave.service");
});

beforeEach(() => {
  jest.resetAllMocks();
  mockClient = { query: jest.fn().mockResolvedValue({ rows: [] }), release: jest.fn() };
  pool.connect.mockResolvedValue(mockClient);
  pool.query.mockResolvedValue({ rows: [] });
  notificationDispatch.sendInAppIfEnabled.mockImplementation((key, fn) => {
    fn();
    return { catch: jest.fn() };
  });
  notificationHelper.notifyEmployee.mockReturnValue({ catch: jest.fn() });
});

describe("calculateDays", () => {
  it("should return 1 for a single day", () => {
    expect(leaveService.calculateDays("2024-03-01", "2024-03-01")).toBe(1);
  });

  it("should return correct days for multi-day range", () => {
    expect(leaveService.calculateDays("2024-03-01", "2024-03-03")).toBe(3);
  });

  it("should return 0.5 for a half-day", () => {
    expect(leaveService.calculateDays("2024-03-01", "2024-03-01", 0.5)).toBe(0.5);
  });

  it("should return correct fraction for multi-day half-day range", () => {
    expect(leaveService.calculateDays("2024-03-01", "2024-03-03", 0.5)).toBe(1.5);
  });

  it("should cross year boundaries", () => {
    expect(leaveService.calculateDays("2024-12-31", "2025-01-02")).toBe(3);
  });

  it("should default dayFraction to 1 when not provided", () => {
    expect(leaveService.calculateDays("2024-06-01", "2024-06-05")).toBe(5);
  });
});

describe("getLeaveById", () => {
  it("should return leave when employee_name is already populated", async () => {
    leaveModel.getById.mockResolvedValue(buildLeaveWithName());

    const result = await leaveService.getLeaveById(1);

    expect(result).toEqual(buildLeaveWithName());
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("should fetch and attach employee details when employee_name is missing", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    pool.query.mockResolvedValueOnce({ rows: [buildEmployee()] });

    const result = await leaveService.getLeaveById(1);

    expect(result.employee_name).toBe("John Doe");
    expect(result.employee_code).toBe("EMP001");
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT first_name, last_name"),
      [1],
    );
  });

  it("should handle missing middle name and suffix", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    pool.query.mockResolvedValueOnce({
      rows: [buildEmployee({
        first_name: "Jane", last_name: "Smith", middle_name: null, suffix: null, employee_code: "EMP002",
      })],
    });

    const result = await leaveService.getLeaveById(2);

    expect(result.employee_name).toBe("Jane Smith");
    expect(result.employee_code).toBe("EMP002");
  });

  it("should handle suffix formatting", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    pool.query.mockResolvedValueOnce({
      rows: [buildEmployee({ first_name: "John", last_name: "Doe", middle_name: "M", suffix: "Jr.", employee_code: "EMP003" })],
    });

    const result = await leaveService.getLeaveById(3);

    expect(result.employee_name).toBe("John M Doe, Jr.");
  });

  it("should not fail when employee query returns no rows", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await leaveService.getLeaveById(1);

    expect(result.employee_name).toBeNull();
    expect(result.employee_code).toBeUndefined();
  });

  it("should return null when leave is not found", async () => {
    leaveModel.getById.mockResolvedValue(null);

    const result = await leaveService.getLeaveById(999);

    expect(result).toBeNull();
    expect(pool.query).not.toHaveBeenCalled();
  });
});

describe("getEmployeeRole", () => {
  it("should return the user role from the pool query", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ role: "admin" }] });

    const result = await leaveService.getEmployeeRole(1);

    expect(result).toBe("admin");
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT u.role"),
      [1],
    );
  });

  it("should return undefined when no user row exists", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await leaveService.getEmployeeRole(999);

    expect(result).toBeUndefined();
  });
});

describe("checkAvailableCredits", () => {
  const typeRow = (overrides = {}) => ({
    id: 1, code: "SL", requires_balance: true, is_unlimited: false, default_days: 15,
    ...overrides,
  });

  it("should return available when sufficient credits exist", async () => {
    pool.query.mockResolvedValueOnce({ rows: [typeRow()] });
    leaveCreditModel.getByEmployee.mockResolvedValue({
      balances: [{
        code: "SL", total_days: 15, carried_over_days: 0, adjusted_days: 0, used_days: 2,
      }],
    });

    const result = await leaveService.checkAvailableCredits(1, "SICK", "2024-03-01", "2024-03-01");

    expect(result).toEqual({ available: true, remaining: 13 });
  });

  it("should return unavailable when insufficient credits", async () => {
    pool.query.mockResolvedValueOnce({ rows: [typeRow()] });
    leaveCreditModel.getByEmployee.mockResolvedValue({
      balances: [{
        code: "SL", total_days: 5, carried_over_days: 0, adjusted_days: 0, used_days: 0,
      }],
    });

    const result = await leaveService.checkAvailableCredits(1, "SICK", "2024-03-01", "2024-03-10");

    expect(result.available).toBe(false);
    expect(result.message).toContain("Insufficient");
    expect(result.remaining).toBe(5);
  });

  it("should return remaining Infinity when type is unlimited", async () => {
    pool.query.mockResolvedValueOnce({ rows: [typeRow({ is_unlimited: true })] });

    const result = await leaveService.checkAvailableCredits(1, "SICK", "2024-03-01", "2024-03-05");

    expect(result).toEqual({ available: true, remaining: Infinity });
    expect(leaveCreditModel.getByEmployee).not.toHaveBeenCalled();
  });

  it("should return remaining Infinity when type does not require balance", async () => {
    pool.query.mockResolvedValueOnce({ rows: [typeRow({ requires_balance: false })] });

    const result = await leaveService.checkAvailableCredits(1, "SICK", "2024-03-01", "2024-03-05");

    expect(result).toEqual({ available: true, remaining: Infinity });
    expect(leaveCreditModel.getByEmployee).not.toHaveBeenCalled();
  });

  it("should throw for invalid or disabled leave type", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(
      leaveService.checkAvailableCredits(1, "INVALID", "2024-03-01", "2024-03-01"),
    ).rejects.toThrow("Invalid or disabled leave type");
  });

  it("should create default credits when getByEmployee returns null", async () => {
    pool.query.mockResolvedValueOnce({ rows: [typeRow()] });
    leaveCreditModel.getByEmployee.mockResolvedValue(null);
    leaveCreditModel.createDefault.mockResolvedValue({
      balances: [{
        code: "SL", total_days: 15, carried_over_days: 0, adjusted_days: 0, used_days: 0,
      }],
    });

    const result = await leaveService.checkAvailableCredits(1, "SICK", "2024-03-01", "2024-03-01");

    expect(result).toEqual({ available: true, remaining: 15 });
    expect(leaveCreditModel.createDefault).toHaveBeenCalledWith(1);
  });

  it("should ensure balance row when code is not in existing balances", async () => {
    pool.query.mockResolvedValueOnce({ rows: [typeRow({ id: 2, code: "VL", default_days: 10 })] });
    leaveCreditModel.getByEmployee.mockResolvedValue({
      balances: [{
        code: "SL", total_days: 5, carried_over_days: 0, adjusted_days: 0, used_days: 0,
      }],
    });

    const result = await leaveService.checkAvailableCredits(1, "ANNUAL", "2024-03-01", "2024-03-01");

    expect(result).toEqual({ available: true, remaining: 10 });
    expect(leaveCreditModel.ensureBalanceRow).toHaveBeenCalledWith(
      1, 2, expect.any(Number), 10,
    );
  });

  it("should incorporate carried_over_days and adjusted_days into remaining", async () => {
    pool.query.mockResolvedValueOnce({ rows: [typeRow()] });
    leaveCreditModel.getByEmployee.mockResolvedValue({
      balances: [{
        code: "SL", total_days: 10, carried_over_days: 5, adjusted_days: 2, used_days: 3,
      }],
    });

    const result = await leaveService.checkAvailableCredits(1, "SICK", "2024-03-01", "2024-03-05");

    expect(result).toEqual({ available: true, remaining: 14 });
  });

  it("should handle NO_PAY (requires_balance false) as always available", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [typeRow({ code: "NP", requires_balance: false })],
    });

    const result = await leaveService.checkAvailableCredits(
      1, "NO_PAY", "2024-03-01", "2024-03-10",
    );

    expect(result).toEqual({ available: true, remaining: Infinity });
  });

  it("should correctly calculate days with half-day fraction", async () => {
    pool.query.mockResolvedValueOnce({ rows: [typeRow()] });
    leaveCreditModel.getByEmployee.mockResolvedValue({
      balances: [{
        code: "SL", total_days: 10, carried_over_days: 0, adjusted_days: 0, used_days: 0,
      }],
    });

    const result = await leaveService.checkAvailableCredits(
      1, "SICK", "2024-03-01", "2024-03-05", 0.5,
    );

    expect(result.available).toBe(true);
    expect(result.remaining).toBe(10);
  });

  it("should fail for half-day request that exceeds remaining credits", async () => {
    pool.query.mockResolvedValueOnce({ rows: [typeRow()] });
    leaveCreditModel.getByEmployee.mockResolvedValue({
      balances: [{
        code: "SL", total_days: 2, carried_over_days: 0, adjusted_days: 0, used_days: 0,
      }],
    });

    const result = await leaveService.checkAvailableCredits(
      1, "SICK", "2024-03-01", "2024-03-05", 1,
    );

    expect(result.available).toBe(false);
    expect(result.remaining).toBe(2);
  });
});

describe("createLeave", () => {
  it("should delegate to leaveModel.createLeave and return result", async () => {
    const data = {
      employee_id: 1, type: "SICK", from_date: "2024-03-01", to_date: "2024-03-01", reason: "Test",
    };
    leaveModel.createLeave.mockResolvedValue({ id: 1, ...data });

    const result = await leaveService.createLeave(data);

    expect(result).toEqual({ id: 1, ...data });
    expect(leaveModel.createLeave).toHaveBeenCalledWith(data);
  });
});

describe("getLeaves", () => {
  it("should delegate to leaveModel.getLeaves with all parameters", async () => {
    const mockResult = { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    leaveModel.getLeaves.mockResolvedValue(mockResult);

    const result = await leaveService.getLeaves(1, 10, "search", "PENDING", "SICK");

    expect(result).toEqual(mockResult);
    expect(leaveModel.getLeaves).toHaveBeenCalledWith(1, 10, "search", "PENDING", "SICK");
  });

  it("should pass through without search/status/type", async () => {
    leaveModel.getLeaves.mockResolvedValue({ data: [], pagination: {} });

    await leaveService.getLeaves();

    expect(leaveModel.getLeaves).toHaveBeenCalledWith(undefined, undefined, undefined, undefined, undefined);
  });
});

describe("getByEmployee", () => {
  it("should delegate to leaveModel.getByEmployee with all parameters", async () => {
    leaveModel.getByEmployee.mockResolvedValue({ data: [], pagination: {} });

    const result = await leaveService.getByEmployee(1, 1, 10, "PENDING");

    expect(result).toEqual({ data: [], pagination: {} });
    expect(leaveModel.getByEmployee).toHaveBeenCalledWith(1, 1, 10, "PENDING");
  });
});

describe("updateStatus", () => {
  beforeEach(() => {
    notificationDispatch.canSendEmail.mockResolvedValue(true);
    pool.query.mockResolvedValue({ rows: [buildEmployee()] });
    emailTemplateService.renderEmail.mockResolvedValue({ subject: "Leave Update", html: "<p>Update</p>" });
    smtpService.sendEmail.mockResolvedValue();
  });

  it("should approve a pending leave and call attendance + credit models", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    const updated = buildLeave({ status: "APPROVED", employee_name: null });
    leaveModel.updateStatus.mockResolvedValue(updated);

    const result = await leaveService.updateStatus(1, "APPROVED");

    expect(leaveModel.updateStatus).toHaveBeenCalledWith(1, "APPROVED", null, mockClient);
    expect(attendanceModel.markAsLeave).toHaveBeenCalledWith(
      1, "2024-03-01", "2024-03-03", 1, null, mockClient,
    );
    expect(leaveCreditModel.useLeave).toHaveBeenCalledWith(1, "SICK", 3, mockClient);
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.query).not.toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalledTimes(1);
    expect(notificationDispatch.sendInAppIfEnabled).toHaveBeenCalledWith(
      "leave_approved", expect.any(Function),
    );
    expect(smtpService.sendEmail).toHaveBeenCalled();
    expect(result).toEqual(updated);
  });

  it("should reject a pending leave without calling attendance or credit models", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    const rejected = buildLeave({ status: "REJECTED" });
    leaveModel.updateStatus.mockResolvedValue(rejected);

    const result = await leaveService.updateStatus(1, "REJECTED", "Insufficient credits");

    expect(leaveModel.updateStatus).toHaveBeenCalledWith(1, "REJECTED", "Insufficient credits", mockClient);
    expect(attendanceModel.markAsLeave).not.toHaveBeenCalled();
    expect(leaveCreditModel.useLeave).not.toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(notificationDispatch.sendInAppIfEnabled).toHaveBeenCalledWith(
      "leave_rejected", expect.any(Function),
    );
    expect(smtpService.sendEmail).toHaveBeenCalled();
    expect(result).toEqual(rejected);
  });

  it("should return existing leave when already approved and re-approving", async () => {
    const approvedLeave = buildLeave({ status: "APPROVED" });
    leaveModel.getById.mockResolvedValue(approvedLeave);

    const result = await leaveService.updateStatus(1, "APPROVED");

    expect(result).toEqual(approvedLeave);
    expect(leaveModel.updateStatus).not.toHaveBeenCalled();
    expect(attendanceModel.markAsLeave).not.toHaveBeenCalled();
    expect(leaveCreditModel.useLeave).not.toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(notificationDispatch.sendInAppIfEnabled).not.toHaveBeenCalled();
    expect(smtpService.sendEmail).not.toHaveBeenCalled();
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it("should approve a previously rejected leave", async () => {
    const rejectedLeave = buildLeave({ status: "REJECTED" });
    leaveModel.getById.mockResolvedValue(rejectedLeave);
    const approvedFromRejected = buildLeave({ status: "APPROVED" });
    leaveModel.updateStatus.mockResolvedValue(approvedFromRejected);

    const result = await leaveService.updateStatus(1, "APPROVED");

    expect(result.status).toBe("APPROVED");
    expect(leaveModel.updateStatus).toHaveBeenCalledWith(1, "APPROVED", null, mockClient);
    expect(attendanceModel.markAsLeave).toHaveBeenCalled();
    expect(leaveCreditModel.useLeave).toHaveBeenCalled();
  });

  it("should handle half-day leave approval correctly", async () => {
    const halfDayLeave = buildLeave({ day_fraction: 0.5, half_day_type: "MORNING" });
    leaveModel.getById.mockResolvedValue(halfDayLeave);
    leaveModel.updateStatus.mockResolvedValue(buildLeave({ day_fraction: 0.5, half_day_type: "MORNING", status: "APPROVED" }));

    await leaveService.updateStatus(1, "APPROVED");

    expect(attendanceModel.markAsLeave).toHaveBeenCalledWith(
      1, "2024-03-01", "2024-03-03", 0.5, "MORNING", mockClient,
    );
    expect(leaveCreditModel.useLeave).toHaveBeenCalledWith(1, "SICK", 1.5, mockClient);
  });

  it("should throw and rollback when leave is not found", async () => {
    leaveModel.getById.mockResolvedValue(null);

    await expect(leaveService.updateStatus(999, "APPROVED")).rejects.toThrow("Leave not found");

    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.query).not.toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalledTimes(1);
    expect(leaveModel.updateStatus).not.toHaveBeenCalled();
  });

  it("should rollback and rethrow when updateStatus model fails", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    leaveModel.updateStatus.mockRejectedValue(new Error("DB write error"));

    await expect(leaveService.updateStatus(1, "APPROVED")).rejects.toThrow("DB write error");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it("should rollback and rethrow when markAsLeave fails", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    leaveModel.updateStatus.mockResolvedValue(buildLeave({ status: "APPROVED" }));
    attendanceModel.markAsLeave.mockRejectedValue(new Error("Attendance insert failed"));

    await expect(leaveService.updateStatus(1, "APPROVED")).rejects.toThrow("Attendance insert failed");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it("should rollback and rethrow when useLeave fails", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    leaveModel.updateStatus.mockResolvedValue(buildLeave({ status: "APPROVED" }));
    leaveCreditModel.useLeave.mockRejectedValue(new Error("Credit deduction failed"));

    await expect(leaveService.updateStatus(1, "APPROVED")).rejects.toThrow("Credit deduction failed");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it("should always release the client in finally block", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    leaveModel.updateStatus.mockRejectedValue(new Error("Any error"));

    await expect(leaveService.updateStatus(1, "APPROVED")).rejects.toThrow();

    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it("should send approval in-app notification with correct message", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    leaveModel.updateStatus.mockResolvedValue(buildLeave({ status: "APPROVED" }));

    await leaveService.updateStatus(1, "APPROVED");

    expect(notificationDispatch.sendInAppIfEnabled).toHaveBeenCalledWith(
      "leave_approved", expect.any(Function),
    );
    expect(notificationHelper.notifyEmployee).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        type: "LEAVE",
        title: "Leave Approved",
        reference_id: 1,
        meta: expect.objectContaining({ status: "APPROVED" }),
      }),
    );
  });

  it("should send rejection in-app notification with reason", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    leaveModel.updateStatus.mockResolvedValue(buildLeave({ status: "REJECTED" }));

    await leaveService.updateStatus(1, "REJECTED", "Policy violation");

    expect(notificationDispatch.sendInAppIfEnabled).toHaveBeenCalledWith(
      "leave_rejected", expect.any(Function),
    );
    expect(notificationHelper.notifyEmployee).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        title: "Leave Declined",
        message: expect.stringContaining("Policy violation"),
        meta: expect.objectContaining({
          status: "REJECTED",
          rejection_reason: "Policy violation",
        }),
      }),
    );
  });

  it("should send half-day leave notification with correct duration text", async () => {
    const halfDayLeave = buildLeave({ day_fraction: 0.5, half_day_type: "AFTERNOON" });
    leaveModel.getById.mockResolvedValue(halfDayLeave);
    leaveModel.updateStatus.mockResolvedValue(buildLeave({ day_fraction: 0.5, half_day_type: "AFTERNOON", status: "APPROVED" }));

    await leaveService.updateStatus(1, "APPROVED");

    expect(notificationHelper.notifyEmployee).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        message: expect.stringContaining("half-day afternoon leave"),
      }),
    );
  });

  it("should send email notification on approval", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    leaveModel.updateStatus.mockResolvedValue(buildLeave({ status: "APPROVED" }));

    await leaveService.updateStatus(1, "APPROVED");

    expect(smtpService.sendEmail).toHaveBeenCalledWith(
      "john@example.com", "Leave Update", "<p>Update</p>",
    );
  });

  it("should send email notification on rejection", async () => {
    leaveModel.getById.mockResolvedValue(buildLeave());
    leaveModel.updateStatus.mockResolvedValue(buildLeave({ status: "REJECTED" }));

    await leaveService.updateStatus(1, "REJECTED", "No reason");

    expect(smtpService.sendEmail).toHaveBeenCalled();
  });
});

describe("sendLeaveEmailNotification", () => {
  beforeEach(() => {
    notificationDispatch.canSendEmail.mockResolvedValue(true);
    pool.query.mockResolvedValue({ rows: [buildEmployee()] });
    emailTemplateService.renderEmail.mockResolvedValue({ subject: "Status", html: "<h1>Status</h1>" });
    smtpService.sendEmail.mockResolvedValue();
  });

  it("should send approved email successfully", async () => {
    const leave = buildLeaveWithName();

    await leaveService.sendLeaveEmailNotification(leave, "APPROVED");

    expect(notificationDispatch.canSendEmail).toHaveBeenCalledWith("leave_approved");
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT e.email"),
      [leave.employee_id],
    );
    expect(emailTemplateService.renderEmail).toHaveBeenCalledWith(
      "LEAVE_APPROVED",
      expect.objectContaining({
        employee_name: "John Doe",
        leave_type: "Sick Leave",
      }),
    );
    expect(smtpService.sendEmail).toHaveBeenCalledWith("john@example.com", "Status", "<h1>Status</h1>");
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Leave APPROVED email sent to john@example.com"),
    );
  });

  it("should send rejected email with rejection reason in template data", async () => {
    await leaveService.sendLeaveEmailNotification(buildLeaveWithName(), "REJECTED", "Policy violation");

    expect(notificationDispatch.canSendEmail).toHaveBeenCalledWith("leave_rejected");
    expect(emailTemplateService.renderEmail).toHaveBeenCalledWith(
      "LEAVE_REJECTED",
      expect.objectContaining({ rejection_reason: "Policy violation" }),
    );
    expect(smtpService.sendEmail).toHaveBeenCalled();
  });

  it("should skip email when notificationDispatch.canSendEmail returns false", async () => {
    notificationDispatch.canSendEmail.mockResolvedValueOnce(false);

    await leaveService.sendLeaveEmailNotification(buildLeaveWithName(), "APPROVED");

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("disabled"));
    expect(pool.query).not.toHaveBeenCalled();
    expect(emailTemplateService.renderEmail).not.toHaveBeenCalled();
    expect(smtpService.sendEmail).not.toHaveBeenCalled();
  });

  it("should skip email when employee has no email address", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [buildEmployee({ email: null })],
    });

    await leaveService.sendLeaveEmailNotification(buildLeaveWithName(), "APPROVED");

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("No email found"));
    expect(smtpService.sendEmail).not.toHaveBeenCalled();
  });

  it("should skip email when employee query returns no rows", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await leaveService.sendLeaveEmailNotification(buildLeaveWithName(), "APPROVED");

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("No email found"));
    expect(smtpService.sendEmail).not.toHaveBeenCalled();
  });

  it("should handle leave with no employee_id gracefully", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await leaveService.sendLeaveEmailNotification(
      buildLeaveWithName({ employee_id: undefined }), "APPROVED",
    );

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("No email found"));
  });

  it("should catch and log error when email template rendering fails", async () => {
    emailTemplateService.renderEmail.mockRejectedValue(new Error("Template render error"));

    await leaveService.sendLeaveEmailNotification(buildLeaveWithName(), "APPROVED");

    expect(logger.error).toHaveBeenCalledWith(
      { error: expect.any(Error) },
      expect.stringContaining("Failed to send leave APPROVED email"),
    );
  });

  it("should catch and log error when smtp sending fails", async () => {
    smtpService.sendEmail.mockRejectedValue(new Error("SMTP connection failed"));

    await leaveService.sendLeaveEmailNotification(buildLeaveWithName(), "APPROVED");

    expect(logger.error).toHaveBeenCalledWith(
      { error: expect.any(Error) },
      expect.stringContaining("Failed to send leave APPROVED email"),
    );
  });

  it("should catch and log error when pool query fails", async () => {
    pool.query.mockRejectedValue(new Error("DB connection lost"));

    await leaveService.sendLeaveEmailNotification(buildLeaveWithName(), "APPROVED");

    expect(logger.error).toHaveBeenCalledWith(
      { error: expect.any(Error) },
      expect.stringContaining("Failed to send leave APPROVED email"),
    );
  });

  it("should format leave type display names correctly", async () => {
    const testCases = [
      { type: "SICK", expected: "Sick Leave" },
      { type: "ANNUAL", expected: "Vacation Leave" },
      { type: "MATERNITY", expected: "Maternity Leave" },
      { type: "EMERGENCY", expected: "Emergency Leave" },
      { type: "NO_PAY", expected: "Unpaid Leave" },
      { type: "UNKNOWN", expected: "UNKNOWN" },
    ];

    for (const { type, expected } of testCases) {
      await leaveService.sendLeaveEmailNotification(
        buildLeaveWithName({ type }), "APPROVED",
      );

      expect(emailTemplateService.renderEmail).toHaveBeenLastCalledWith(
        "LEAVE_APPROVED",
        expect.objectContaining({ leave_type: expected }),
      );
    }
  });

  it("should default reason to 'No reason provided' when not given", async () => {
    await leaveService.sendLeaveEmailNotification(
      buildLeaveWithName({ reason: null }), "APPROVED",
    );

    expect(emailTemplateService.renderEmail).toHaveBeenCalledWith(
      "LEAVE_APPROVED",
      expect.objectContaining({ reason: "No reason provided" }),
    );
  });
});
