jest.mock("../models/applicantApproval.model", () => ({
  getByApplicantId: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));
jest.mock("../models/applicant.model", () => ({
  getById: jest.fn(),
  updateStatus: jest.fn(),
  getActiveHRUserIds: jest.fn(),
  getUserIdsByEmployeeIds: jest.fn(),
}));
jest.mock("../services/notification.service", () => ({ notify: jest.fn() }));
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));

const approvalModel = require("../models/applicantApproval.model");
const applicantModel = require("../models/applicant.model");
const {
  getByApplicantId,
  getById,
  create,
  update,
} = require("../services/applicantApproval.service");

describe("applicantApproval.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByApplicantId", () => {
    it("returns approvals for existing applicant", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      approvalModel.getByApplicantId.mockResolvedValue([{ id: 1, approval_type: "HIRING" }]);
      const result = await getByApplicantId(1);
      expect(result).toHaveLength(1);
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(getByApplicantId(999)).rejects.toThrow("Applicant not found");
    });
  });

  describe("getById", () => {
    it("returns approval when found", async () => {
      approvalModel.getById.mockResolvedValue({ id: 1, decision: "PENDING" });
      const result = await getById(1);
      expect(result.decision).toBe("PENDING");
    });

    it("throws when approval not found", async () => {
      approvalModel.getById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Approval record not found");
    });
  });

  describe("create", () => {
    it("creates approval with valid data", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, first_name: "John", last_name: "Doe" });
      applicantModel.getUserIdsByEmployeeIds.mockResolvedValue([]);
      approvalModel.create.mockResolvedValue({ id: 1, applicant_id: 1, approval_type: "HIRING", decision: "PENDING" });
      const result = await create({ applicant_id: 1, approval_type: "HIRING" });
      expect(result.id).toBe(1);
    });

    it("throws when applicant_id missing", async () => {
      await expect(create({ approval_type: "HIRING" })).rejects.toThrow("Applicant ID is required");
    });

    it("throws when approval_type missing", async () => {
      await expect(create({ applicant_id: 1 })).rejects.toThrow("Approval type is required");
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(create({ applicant_id: 999, approval_type: "HIRING" })).rejects.toThrow("Applicant not found");
    });
  });

  describe("update", () => {
    it("updates approval with APPROVED decision and updates applicant status", async () => {
      approvalModel.getById.mockResolvedValue({ id: 1, applicant_id: 1, approval_type: "HIRING", decision: "PENDING" });
      approvalModel.update.mockResolvedValue({ id: 1, applicant_id: 1, decision: "APPROVED" });
      applicantModel.getById.mockResolvedValue({ id: 1, first_name: "John", last_name: "Doe" });
      applicantModel.getById.mockResolvedValue({ id: 1, first_name: "John", last_name: "Doe" });
      applicantModel.getActiveHRUserIds.mockResolvedValue([]);
      const result = await update(1, { decision: "APPROVED" });
      expect(result.decision).toBe("APPROVED");
      expect(applicantModel.updateStatus).toHaveBeenCalledWith(1, "Completed");
    });

    it("updates approval with REJECTED decision and updates applicant status", async () => {
      approvalModel.getById.mockResolvedValue({ id: 1, applicant_id: 1, approval_type: "HIRING", decision: "PENDING" });
      approvalModel.update.mockResolvedValue({ id: 1, applicant_id: 1, decision: "REJECTED" });
      applicantModel.getById.mockResolvedValue({ id: 1, first_name: "John", last_name: "Doe" });
      applicantModel.getActiveHRUserIds.mockResolvedValue([]);
      const result = await update(1, { decision: "REJECTED" });
      expect(result.decision).toBe("REJECTED");
      expect(applicantModel.updateStatus).toHaveBeenCalledWith(1, "Fail");
    });

    it("throws when approval not found", async () => {
      approvalModel.getById.mockResolvedValue(null);
      await expect(update(999, {})).rejects.toThrow("Approval record not found");
    });
  });
});
