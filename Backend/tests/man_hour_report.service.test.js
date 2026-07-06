jest.mock("../models/man_hour_report.model", () => ({
  createManHourReportWithDetails: jest.fn(),
  existsForDate: jest.fn(),
  getMyManHourReports: jest.fn(),
  getAllManHourReports: jest.fn(),
  getManHourReportDetails: jest.fn(),
  approveManHourReport: jest.fn(),
  rejectManHourReport: jest.fn(),
  canApprove: jest.fn(),
  getManHourSummary: jest.fn(),
  updateManHourReportWithDetails: jest.fn(),
  deleteManHourReport: jest.fn(),
  getMissingManHourDates: jest.fn(),
  getDetailedReports: jest.fn(),
}));
jest.mock("../utils/inputSanitizer", () => ({ cleanPlainText: jest.fn((x) => x) }));
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));
jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../services/notificationHelper.service", () => ({ notifyEmployee: jest.fn() }));
jest.mock("../services/notificationDispatch.service", () => ({ canSendEmail: jest.fn(), sendInAppIfEnabled: jest.fn() }));
jest.mock("../services/smtp.service", () => ({ sendEmail: jest.fn() }));
jest.mock("../services/emailTemplate.service", () => ({ renderEmail: jest.fn() }));

const model = require("../models/man_hour_report.model");
const pool = require("../config/db");
const notificationDispatch = require("../services/notificationDispatch.service");
const {
  createManHourReport, getMyManHourReports, getAllManHourReports,
  getManHourReportDetails, approveManHourReport, rejectManHourReport,
  getManHourSummary, updateManHourReport, deleteManHourReport,
  isApprover, sendManHourEmailNotification, getMissingManHourDates,
  getDetailedReports,
} = require("../services/man_hour_report.service");

describe("man_hour_report.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("createManHourReport", () => {
    it("creates with details format", async () => {
      model.createManHourReportWithDetails.mockResolvedValue({ id: 1 });
      const result = await createManHourReport(1, {
        work_date: "2026-01-01", details: [{ activity: "Work", hours: 8 }],
      });
      expect(result.id).toBe(1);
    });

    it("creates legacy single-entry", async () => {
      model.existsForDate.mockResolvedValue(false);
      model.createManHourReportWithDetails.mockResolvedValue({ id: 1 });
      const result = await createManHourReport(1, { work_date: "2026-01-01", hours: 8, task: "Task" });
      expect(result.id).toBe(1);
    });

    it("throws when duplicate exists for legacy format", async () => {
      model.existsForDate.mockResolvedValue(true);
      await expect(createManHourReport(1, { work_date: "2026-01-01", hours: 8 })).rejects.toThrow("already exists");
    });
  });

  describe("getMyManHourReports", () => {
    it("returns my reports", async () => {
      model.getMyManHourReports.mockResolvedValue([{ id: 1 }]);
      expect(await getMyManHourReports(1, 1, 10, "", "")).toHaveLength(1);
    });
  });

  describe("getAllManHourReports", () => {
    it("returns all reports", async () => {
      model.getAllManHourReports.mockResolvedValue([{ id: 1 }]);
      expect(await getAllManHourReports(1, 1, 10, "", "", "ADMIN")).toHaveLength(1);
    });
  });

  describe("getManHourReportDetails", () => {
    it("returns details", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1 });
      expect(await getManHourReportDetails(1, 1)).toEqual({ id: 1 });
    });
    it("handles empty user_id", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1 });
      expect(await getManHourReportDetails(1, "")).toEqual({ id: 1 });
      expect(model.getManHourReportDetails).toHaveBeenCalledWith(1, null);
    });
  });

  describe("approveManHourReport", () => {
    it("throws when approving own", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1, employee_id: 1 });
      await expect(approveManHourReport(1, 1, "", "ADMIN")).rejects.toThrow("cannot approve your own");
    });
    it("approves as admin", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1, employee_id: 2, work_date: "2026-01-01", hours: 8, task: "Work" });
      model.approveManHourReport.mockResolvedValue({ id: 1, status: "APPROVED" });
      notificationDispatch.sendInAppIfEnabled.mockImplementation((k, fn) => fn());
      notificationDispatch.canSendEmail.mockResolvedValue(false);
      const result = await approveManHourReport(1, 1, "Good", "ADMIN");
      expect(result.status).toBe("APPROVED");
    });
    it("throws lacking permission", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1, employee_id: 2 });
      model.canApprove.mockResolvedValue(false);
      await expect(approveManHourReport(1, 1, "", "MANAGER")).rejects.toThrow("don't have permission");
    });
  });

  describe("rejectManHourReport", () => {
    it("throws when rejecting own", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1, employee_id: 1 });
      await expect(rejectManHourReport(1, 1, "No", "ADMIN")).rejects.toThrow("cannot reject your own");
    });
    it("throws when no reason", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1, employee_id: 2 });
      await expect(rejectManHourReport(1, 1, "", "ADMIN")).rejects.toThrow("Rejection reason is required");
    });
    it("rejects report", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1, employee_id: 2, work_date: "2026-01-01", hours: 8, task: "Work" });
      model.rejectManHourReport.mockResolvedValue({ id: 1, status: "REJECTED" });
      notificationDispatch.sendInAppIfEnabled.mockImplementation((k, fn) => fn());
      notificationDispatch.canSendEmail.mockResolvedValue(false);
      const result = await rejectManHourReport(1, 1, "Not needed", "ADMIN");
      expect(result.status).toBe("REJECTED");
    });
  });

  describe("getManHourSummary", () => {
    it("returns summary", async () => {
      model.getManHourSummary.mockResolvedValue({ total_hours: 40 });
      expect(await getManHourSummary("2026-01-01", "2026-01-31", 1)).toEqual({ total_hours: 40 });
    });
  });

  describe("updateManHourReport", () => {
    it("updates with details format", async () => {
      model.updateManHourReportWithDetails.mockResolvedValue({ id: 1 });
      const result = await updateManHourReport(1, 1, {
        details: [{ activity: "Updated", hours: 4 }],
      });
      expect(result.id).toBe(1);
    });

    it("throws when not owner", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1, employee_id: 2 });
      await expect(updateManHourReport(1, 1, { hours: 4, task: "Work" })).rejects.toThrow("can only update your own");
    });

    it("throws when approved", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1, employee_id: 1, status: "APPROVED" });
      await expect(updateManHourReport(1, 1, { hours: 4, task: "Work" })).rejects.toThrow("Cannot update an approved");
    });
  });

  describe("deleteManHourReport", () => {
    it("throws when not owner and not admin", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1, employee_id: 2 });
      await expect(deleteManHourReport(1, 1, "MANAGER")).rejects.toThrow("don't have permission");
    });
    it("throws when approved", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1, employee_id: 1, status: "APPROVED" });
      await expect(deleteManHourReport(1, 1, "ADMIN")).rejects.toThrow("Cannot delete an approved");
    });
    it("deletes report", async () => {
      model.getManHourReportDetails.mockResolvedValue({ id: 1, employee_id: 1, status: "PENDING" });
      await expect(deleteManHourReport(1, 1, "ADMIN")).resolves.toBeUndefined();
      expect(model.deleteManHourReport).toHaveBeenCalledWith(1);
    });
  });

  describe("isApprover", () => {
    it("returns true when approver", async () => {
      pool.query.mockResolvedValue({ rows: [{ is_approver: true }] });
      expect(await isApprover(1)).toBe(true);
    });
  });

  describe("sendManHourEmailNotification", () => {
    it("sends email", async () => {
      notificationDispatch.canSendEmail.mockResolvedValue(true);
      pool.query.mockResolvedValue({ rows: [{ email: "e@e.com", first_name: "J", last_name: "D" }] });
      const emailTemplateService = require("../services/emailTemplate.service");
      emailTemplateService.renderEmail.mockResolvedValue({ subject: "S", html: "<p>H</p>" });
      const smtpService = require("../services/smtp.service");
      await sendManHourEmailNotification({ employee_id: 1, work_date: "2026-01-01", hours: 8, task: "Work" }, "APPROVED");
      expect(smtpService.sendEmail).toHaveBeenCalled();
    });
  });

  describe("getMissingManHourDates", () => {
    it("throws when missing dates", async () => {
      await expect(getMissingManHourDates(1, "", "")).rejects.toThrow("start_date and end_date are required");
    });
    it("returns missing dates", async () => {
      model.getMissingManHourDates.mockResolvedValue(["2026-01-01"]);
      expect(await getMissingManHourDates(1, "2026-01-01", "2026-01-31")).toEqual(["2026-01-01"]);
    });
  });

  describe("getDetailedReports", () => {
    it("returns detailed reports", async () => {
      model.getDetailedReports.mockResolvedValue([{ id: 1 }]);
      expect(await getDetailedReports(1, "2026-01-01", "2026-01-31")).toHaveLength(1);
    });
  });
});
