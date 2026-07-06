jest.mock("../models/applicantInterview.model", () => ({
  getByApplicantId: jest.fn(),
  getByUserId: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getPossibleInterviewers: jest.fn(),
}));
jest.mock("../models/applicant.model", () => ({
  getById: jest.fn(),
  getActiveHRUserIds: jest.fn(),
}));
jest.mock("../services/notification.service", () => ({ notify: jest.fn() }));
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));

const interviewModel = require("../models/applicantInterview.model");
const applicantModel = require("../models/applicant.model");
const {
  getByApplicantId,
  getById,
  getMyInterviews,
  getPossibleInterviewers,
  getSuggestedApplicantStage,
  create,
  update,
  remove,
} = require("../services/applicantInterview.service");

describe("applicantInterview.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByApplicantId", () => {
    it("returns interviews for existing applicant", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      interviewModel.getByApplicantId.mockResolvedValue([{ id: 1, interview_type: "Initial Interview" }]);
      const result = await getByApplicantId(1);
      expect(result).toHaveLength(1);
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(getByApplicantId(999)).rejects.toThrow("Applicant not found");
    });
  });

  describe("getById", () => {
    it("returns interview when found", async () => {
      interviewModel.getById.mockResolvedValue({ id: 1, status: "SCHEDULED" });
      const result = await getById(1);
      expect(result.status).toBe("SCHEDULED");
    });

    it("throws when interview not found", async () => {
      interviewModel.getById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Interview not found");
    });
  });

  describe("getMyInterviews", () => {
    it("returns interviews for user", async () => {
      interviewModel.getByUserId.mockResolvedValue([{ id: 1, interviewer_user_id: 1 }]);
      const result = await getMyInterviews(1);
      expect(result).toHaveLength(1);
    });
  });

  describe("getPossibleInterviewers", () => {
    it("returns possible interviewers", async () => {
      interviewModel.getPossibleInterviewers.mockResolvedValue([{ user_id: 1, employee_name: "John Doe" }]);
      const result = await getPossibleInterviewers();
      expect(result).toHaveLength(1);
    });
  });

  describe("getSuggestedApplicantStage", () => {
    it("returns next stage for PASSED Initial Interview", () => {
      expect(getSuggestedApplicantStage("Initial Interview", "PASSED")).toBe("Exam Interview");
    });

    it("returns next stage for PASSED Exam Interview", () => {
      expect(getSuggestedApplicantStage("Exam Interview", "PASSED")).toBe("Final Interview");
    });

    it("returns next stage for PASSED Final Interview", () => {
      expect(getSuggestedApplicantStage("Final Interview", "PASSED")).toBe("Completed");
    });

    it("returns Fail for FAILED recommendation", () => {
      expect(getSuggestedApplicantStage("Initial Interview", "FAILED")).toBe("Fail");
    });

    it("returns null for FOR_REVIEW recommendation", () => {
      expect(getSuggestedApplicantStage("Initial Interview", "FOR_REVIEW")).toBeNull();
    });

    it("returns null when no recommendation", () => {
      expect(getSuggestedApplicantStage("Initial Interview", null)).toBeNull();
    });

    it("returns null for unknown interview type", () => {
      expect(getSuggestedApplicantStage("Unknown", "PASSED")).toBeNull();
    });
  });

  describe("create", () => {
    it("creates interview with valid data", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, first_name: "John", last_name: "Doe" });
      interviewModel.create.mockResolvedValue({ id: 1, applicant_id: 1, interview_date: new Date(), interviewer_user_id: null });
      applicantModel.getActiveHRUserIds.mockResolvedValue([]);
      const result = await create({ applicant_id: 1, interview_date: new Date() });
      expect(result.id).toBe(1);
    });

    it("throws when applicant_id missing", async () => {
      await expect(create({ interview_date: new Date() })).rejects.toThrow("Applicant ID is required");
    });

    it("throws when interview_date missing", async () => {
      await expect(create({ applicant_id: 1 })).rejects.toThrow("Interview date is required");
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(create({ applicant_id: 999, interview_date: new Date() })).rejects.toThrow("Applicant not found");
    });

    it("throws with invalid rating", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      await expect(create({ applicant_id: 1, interview_date: new Date(), rating: 15 })).rejects.toThrow("Rating must be between 0 and 10");
    });

    it("throws with invalid recommendation", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      await expect(create({ applicant_id: 1, interview_date: new Date(), recommendation: "INVALID" })).rejects.toThrow("Recommendation must be PASSED, FAILED, or FOR_REVIEW");
    });
  });

  describe("update", () => {
    it("updates existing interview", async () => {
      interviewModel.getById.mockResolvedValue({ id: 1, applicant_id: 1, status: "SCHEDULED", recommendation: null });
      interviewModel.update.mockResolvedValue({ id: 1, status: "SCHEDULED", recommendation: null });
      const result = await update(1, { notes: "Updated notes" });
      expect(result).toBeDefined();
    });

    it("throws when interview not found", async () => {
      interviewModel.getById.mockResolvedValue(null);
      await expect(update(999, {})).rejects.toThrow("Interview not found");
    });

    it("auto-completes status when recommendation given with SCHEDULED status", async () => {
      interviewModel.getById.mockResolvedValue({ id: 1, applicant_id: 1, status: "SCHEDULED", recommendation: null, interviewer_user_id: null });
      interviewModel.update.mockResolvedValue({ id: 1, status: "COMPLETED", recommendation: "PASSED" });
      applicantModel.getById.mockResolvedValue({ id: 1, first_name: "John", last_name: "Doe" });
      applicantModel.getActiveHRUserIds.mockResolvedValue([]);
      const result = await update(1, { recommendation: "PASSED" });
      expect(interviewModel.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: "COMPLETED" }));
    });
  });

  describe("remove", () => {
    it("removes existing interview", async () => {
      interviewModel.getById.mockResolvedValue({ id: 1 });
      interviewModel.remove.mockResolvedValue({ id: 1 });
      await expect(remove(1)).resolves.toBeDefined();
    });

    it("throws when interview not found", async () => {
      interviewModel.getById.mockResolvedValue(null);
      await expect(remove(999)).rejects.toThrow("Interview not found");
    });
  });
});
