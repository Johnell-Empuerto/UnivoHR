jest.mock("../models/overtime.model", () => ({
  createOvertime: jest.fn(),
  getMyOvertime: jest.fn(),
  getAllOvertime: jest.fn(),
  getOvertimeDetails: jest.fn(),
  getOvertimeBasic: jest.fn(),
  approveOvertime: jest.fn(),
  rejectOvertime: jest.fn(),
  canApprove: jest.fn(),
  deleteOvertimeRequest: jest.fn(),
  getOvertimeHoursForPayroll: jest.fn(),
  markOvertimeAsPaid: jest.fn(),
  getOvertimeSummaryForPayroll: jest.fn(),
  getApprovers: jest.fn(),
  createApprover: jest.fn(),
  updateApprover: jest.fn(),
  deleteApprover: jest.fn(),
  getEmployeesForDropdown: jest.fn(),
  searchEmployeesPaginated: jest.fn(),
  isApprover: jest.fn(),
}));
jest.mock("../utils/inputSanitizer", () => ({ cleanPlainText: jest.fn((x) => x) }));
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));
jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../services/notificationHelper.service", () => ({ notifyEmployee: jest.fn() }));
jest.mock("../services/notificationDispatch.service", () => ({
  canSendEmail: jest.fn(),
  sendInAppIfEnabled: jest.fn().mockReturnValue({ catch: jest.fn() }),
}));
jest.mock("../services/smtp.service", () => ({ sendEmail: jest.fn() }));
jest.mock("../services/emailTemplate.service", () => ({ renderEmail: jest.fn() }));

const model = require("../models/overtime.model");
const logger = require("../utils/logger");
const notificationDispatch = require("../services/notificationDispatch.service");
const notificationHelper = require("../services/notificationHelper.service");
const {
  createOvertime, getMyOvertime, getAllOvertime, getOvertimeDetails,
  approveOvertime, rejectOvertime, removeRequest,
  getOvertimeHoursForPayroll, markOvertimeAsPaid, getOvertimeSummaryForPayroll,
  getApprovers, createApprover, updateApprover, deleteApprover,
  getEmployeesForDropdown, searchEmployeesPaginated, isApprover,
  sendOvertimeEmailNotification,
} = require("../services/overtime.service");

describe("overtime.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("createOvertime", () => {
    it("creates overtime", async () => {
      model.createOvertime.mockResolvedValue({ id: 1 });
      const result = await createOvertime(1, { date: "2026-01-01", hours: 2 });
      expect(result.id).toBe(1);
    });
  });

  describe("getMyOvertime", () => {
    it("returns my overtime", async () => {
      model.getMyOvertime.mockResolvedValue([{ id: 1 }]);
      expect(await getMyOvertime(1, 1, 10, "", "")).toHaveLength(1);
    });
  });

  describe("getAllOvertime", () => {
    it("returns all overtime with valid user_id", async () => {
      model.getAllOvertime.mockResolvedValue([{ id: 1 }]);
      expect(await getAllOvertime(1, 1, 10, "", "", "", "ADMIN")).toHaveLength(1);
    });
    it("handles empty user_id", async () => {
      model.getAllOvertime.mockResolvedValue([{ id: 1 }]);
      expect(await getAllOvertime("", 1, 10, "", "", "", "ADMIN")).toHaveLength(1);
      expect(model.getAllOvertime).toHaveBeenCalledWith(null, 1, 10, "", "", "", "ADMIN");
    });
  });

  describe("getOvertimeDetails", () => {
    it("returns overtime details", async () => {
      model.getOvertimeDetails.mockResolvedValue({ id: 1 });
      expect(await getOvertimeDetails(1, 1)).toEqual({ id: 1 });
    });
  });

  describe("approveOvertime", () => {
    it("throws when approving own request", async () => {
      model.getOvertimeDetails.mockResolvedValue({ id: 1, employee_id: 1 });
      await expect(approveOvertime(1, 1, "", "ADMIN")).rejects.toThrow("cannot approve your own");
    });
    it("throws when overtime already paid", async () => {
      model.getOvertimeDetails.mockResolvedValue({ id: 1, employee_id: 2, is_paid: true });
      await expect(approveOvertime(1, 1, "", "ADMIN")).rejects.toThrow("Cannot approve already paid");
    });
    it("approves as admin", async () => {
      model.getOvertimeDetails.mockResolvedValue({ id: 1, employee_id: 2, is_paid: false });
      model.approveOvertime.mockResolvedValue({ id: 1, status: "APPROVED" });
      notificationDispatch.sendInAppIfEnabled.mockImplementation((k, fn) => { fn(); return { catch: jest.fn() }; });
      const result = await approveOvertime(1, 1, "Good", "ADMIN");
      expect(result.status).toBe("APPROVED");
    });
    it("throws when lacking permission", async () => {
      model.getOvertimeDetails.mockResolvedValue({ id: 1, employee_id: 2, is_paid: false });
      model.canApprove.mockResolvedValue(false);
      await expect(approveOvertime(1, 1, "Good", "MANAGER")).rejects.toThrow("don't have permission");
    });
  });

  describe("rejectOvertime", () => {
    it("throws when rejecting own request", async () => {
      model.getOvertimeBasic.mockResolvedValue({ id: 1, employee_id: 1 });
      await expect(rejectOvertime(1, 1, "No", "ADMIN")).rejects.toThrow("cannot reject your own");
    });
    it("throws when already paid", async () => {
      model.getOvertimeBasic.mockResolvedValue({ id: 1, employee_id: 2, is_paid: true });
      await expect(rejectOvertime(1, 1, "No", "ADMIN")).rejects.toThrow("Cannot reject already paid");
    });
    it("rejects overtime", async () => {
      model.getOvertimeBasic.mockResolvedValue({ id: 1, employee_id: 2, is_paid: false });
      model.rejectOvertime.mockResolvedValue({ id: 1, status: "REJECTED" });
      notificationDispatch.sendInAppIfEnabled.mockImplementation((k, fn) => { fn(); return { catch: jest.fn() }; });
      const result = await rejectOvertime(1, 1, "Not needed", "ADMIN");
      expect(result.status).toBe("REJECTED");
    });
  });

  describe("removeRequest", () => {
    it("throws when not found", async () => {
      model.getOvertimeBasic.mockResolvedValue(null);
      await expect(removeRequest(1)).rejects.toThrow("Overtime request not found");
    });
    it("throws when already approved", async () => {
      model.getOvertimeBasic.mockResolvedValue({ id: 1, status: "APPROVED" });
      await expect(removeRequest(1)).rejects.toThrow("Cannot delete an approved overtime request");
    });
    it("deletes request", async () => {
      model.getOvertimeBasic.mockResolvedValue({ id: 1, status: "PENDING" });
      await expect(removeRequest(1)).resolves.toBeUndefined();
      expect(model.deleteOvertimeRequest).toHaveBeenCalledWith(1);
    });
  });

  describe("getOvertimeHoursForPayroll", () => {
    it("returns hours for payroll", async () => {
      model.getOvertimeHoursForPayroll.mockResolvedValue({ total_hours: 5 });
      expect(await getOvertimeHoursForPayroll(1, "2026-01-01", "2026-01-15")).toEqual({ total_hours: 5 });
    });
  });

  describe("markOvertimeAsPaid", () => {
    it("marks as paid", async () => {
      model.markOvertimeAsPaid.mockResolvedValue({ updated: 1 });
      expect(await markOvertimeAsPaid(1, "2026-01-01", "2026-01-15", 1)).toEqual({ updated: 1 });
    });
  });

  describe("getOvertimeSummaryForPayroll", () => {
    it("returns summary", async () => {
      model.getOvertimeSummaryForPayroll.mockResolvedValue([{ employee_id: 1 }]);
      expect(await getOvertimeSummaryForPayroll("2026-01-01", "2026-01-15")).toHaveLength(1);
    });
  });

  describe("getApprovers", () => {
    it("returns approvers", async () => {
      model.getApprovers.mockResolvedValue([{ id: 1 }]);
      expect(await getApprovers(1, 10, "", "OVERTIME")).toHaveLength(1);
    });
  });

  describe("createApprover", () => {
    it("creates approver", async () => {
      model.createApprover.mockResolvedValue({ id: 1 });
      expect(await createApprover({})).toEqual({ id: 1 });
    });
  });

  describe("updateApprover", () => {
    it("updates approver", async () => {
      model.updateApprover.mockResolvedValue({ id: 1 });
      expect(await updateApprover(1, {})).toEqual({ id: 1 });
    });
  });

  describe("deleteApprover", () => {
    it("deletes approver", async () => {
      await expect(deleteApprover(1)).resolves.toBeUndefined();
      expect(model.deleteApprover).toHaveBeenCalledWith(1);
    });
  });

  describe("getEmployeesForDropdown", () => {
    it("returns employees", async () => {
      model.getEmployeesForDropdown.mockResolvedValue([{ id: 1 }]);
      expect(await getEmployeesForDropdown()).toHaveLength(1);
    });
  });

  describe("searchEmployeesPaginated", () => {
    it("returns paginated employees", async () => {
      model.searchEmployeesPaginated.mockResolvedValue({ data: [], pagination: {} });
      expect(await searchEmployeesPaginated(1, 10, "", "", false)).toBeDefined();
    });
  });

  describe("isApprover", () => {
    it("returns approver status", async () => {
      model.isApprover.mockResolvedValue(true);
      expect(await isApprover(1)).toBe(true);
    });
  });

  describe("sendOvertimeEmailNotification", () => {
    it("sends email notification", async () => {
      const overtime = { employee_id: 1, date: "2026-01-01", hours: 2, reason: "OT" };
      notificationDispatch.canSendEmail.mockResolvedValue(true);
      const pool = require("../config/db");
      pool.query.mockResolvedValue({ rows: [{ email: "e@e.com", first_name: "J", last_name: "D" }] });
      const emailTemplateService = require("../services/emailTemplate.service");
      emailTemplateService.renderEmail.mockResolvedValue({ subject: "OT", html: "<p>OT</p>" });
      const smtpService = require("../services/smtp.service");
      await sendOvertimeEmailNotification(overtime, "APPROVED");
      expect(smtpService.sendEmail).toHaveBeenCalled();
    });
  });
});
