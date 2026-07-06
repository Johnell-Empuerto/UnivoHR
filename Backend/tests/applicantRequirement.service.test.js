jest.mock("../models/applicantRequirement.model", () => ({
  getByApplicantId: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("../models/applicant.model", () => ({
  getById: jest.fn(),
}));

const reqModel = require("../models/applicantRequirement.model");
const applicantModel = require("../models/applicant.model");
const {
  getByApplicantId,
  create,
  update,
  remove,
  hasUncompletedRequirements,
} = require("../services/applicantRequirement.service");

describe("applicantRequirement.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByApplicantId", () => {
    it("returns requirements for existing applicant", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      reqModel.getByApplicantId.mockResolvedValue([{ id: 1, requirement_name: "SSS" }]);
      const result = await getByApplicantId(1);
      expect(result).toHaveLength(1);
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(getByApplicantId(999)).rejects.toThrow("Applicant not found");
    });
  });

  describe("create", () => {
    it("creates requirement with valid data", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      reqModel.create.mockResolvedValue({ id: 1, requirement_name: "SSS", status: "Pending" });
      const result = await create(1, { requirement_name: "SSS" });
      expect(result.id).toBe(1);
      expect(result.status).toBe("Pending");
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(create(999, { requirement_name: "SSS" })).rejects.toThrow("Applicant not found");
    });

    it("throws when requirement_name empty", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      await expect(create(1, { requirement_name: "" })).rejects.toThrow("Requirement name is required");
    });

    it("throws with invalid status", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      await expect(create(1, { requirement_name: "SSS", status: "Invalid" })).rejects.toThrow("Invalid status");
    });
  });

  describe("update", () => {
    it("updates existing requirement", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      reqModel.getById.mockResolvedValue({ id: 1, applicant_id: 1, requirement_name: "SSS", status: "Pending" });
      reqModel.update.mockResolvedValue({ id: 1, requirement_name: "SSS Updated", status: "Completed" });
      const result = await update(1, 1, { requirement_name: "SSS Updated", status: "Completed" });
      expect(result.requirement_name).toBe("SSS Updated");
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(update(999, 1, {})).rejects.toThrow("Applicant not found");
    });

    it("throws when requirement not found", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      reqModel.getById.mockResolvedValue(null);
      await expect(update(1, 999, {})).rejects.toThrow("Requirement not found");
    });

    it("throws when requirement does not belong to applicant", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      reqModel.getById.mockResolvedValue({ id: 1, applicant_id: 2 });
      await expect(update(1, 1, {})).rejects.toThrow("Requirement does not belong to this applicant");
    });

    it("sets verified_date when status becomes Completed", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      reqModel.getById.mockResolvedValue({ id: 1, applicant_id: 1, requirement_name: "SSS", status: "Pending", verified_date: null });
      reqModel.update.mockResolvedValue({ id: 1, status: "Completed" });
      const result = await update(1, 1, { status: "Completed" });
      expect(reqModel.update).toHaveBeenCalledWith(1, expect.objectContaining({ verified_date: expect.any(String) }));
      expect(result.status).toBe("Completed");
    });
  });

  describe("remove", () => {
    it("removes requirement belonging to applicant", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      reqModel.getById.mockResolvedValue({ id: 1, applicant_id: 1 });
      reqModel.remove.mockResolvedValue({ id: 1 });
      await expect(remove(1, 1)).resolves.toBeDefined();
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(remove(999, 1)).rejects.toThrow("Applicant not found");
    });

    it("throws when requirement not found", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1 });
      reqModel.getById.mockResolvedValue(null);
      await expect(remove(1, 999)).rejects.toThrow("Requirement not found");
    });
  });

  describe("hasUncompletedRequirements", () => {
    it("returns true when some requirements are not Completed", async () => {
      reqModel.getByApplicantId.mockResolvedValue([
        { id: 1, status: "Completed" },
        { id: 2, status: "Pending" },
      ]);
      const result = await hasUncompletedRequirements(1);
      expect(result).toBe(true);
    });

    it("returns false when all requirements are Completed", async () => {
      reqModel.getByApplicantId.mockResolvedValue([
        { id: 1, status: "Completed" },
        { id: 2, status: "Completed" },
      ]);
      const result = await hasUncompletedRequirements(1);
      expect(result).toBe(false);
    });

    it("returns false when no requirements exist", async () => {
      reqModel.getByApplicantId.mockResolvedValue([]);
      const result = await hasUncompletedRequirements(1);
      expect(result).toBe(false);
    });
  });
});
