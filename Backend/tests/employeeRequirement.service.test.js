jest.mock("../models/employeeRequirement.model", () => ({
  getByOnboardingId: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("../models/employeeOnboarding.model", () => ({
  getById: jest.fn(),
}));

const reqModel = require("../models/employeeRequirement.model");
const onboardingModel = require("../models/employeeOnboarding.model");
const {
  getByOnboardingId,
  getById,
  create,
  update,
  remove,
} = require("../services/employeeRequirement.service");

describe("employeeRequirement.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByOnboardingId", () => {
    it("returns requirements for existing onboarding", async () => {
      onboardingModel.getById.mockResolvedValue({ id: 1 });
      reqModel.getByOnboardingId.mockResolvedValue([{ id: 1, requirement_name: "SSS" }]);
      const result = await getByOnboardingId(1);
      expect(result).toHaveLength(1);
    });

    it("throws when onboarding not found", async () => {
      onboardingModel.getById.mockResolvedValue(null);
      await expect(getByOnboardingId(999)).rejects.toThrow("Onboarding record not found");
    });
  });

  describe("getById", () => {
    it("returns requirement when found", async () => {
      reqModel.getById.mockResolvedValue({ id: 1, requirement_name: "SSS" });
      const result = await getById(1);
      expect(result.requirement_name).toBe("SSS");
    });

    it("throws when requirement not found", async () => {
      reqModel.getById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Requirement not found");
    });
  });

  describe("create", () => {
    it("creates requirement with valid data", async () => {
      onboardingModel.getById.mockResolvedValue({ id: 1 });
      reqModel.create.mockResolvedValue({ id: 1, onboarding_id: 1, requirement_name: "SSS" });
      const result = await create({ onboarding_id: 1, requirement_name: "SSS" });
      expect(result.id).toBe(1);
    });

    it("throws when onboarding_id missing", async () => {
      await expect(create({ requirement_name: "SSS" })).rejects.toThrow("Onboarding ID is required");
    });

    it("throws when requirement_name missing", async () => {
      await expect(create({ onboarding_id: 1, requirement_name: "" })).rejects.toThrow("Requirement name is required");
    });

    it("throws when onboarding not found", async () => {
      onboardingModel.getById.mockResolvedValue(null);
      await expect(create({ onboarding_id: 999, requirement_name: "SSS" })).rejects.toThrow("Onboarding record not found");
    });
  });

  describe("update", () => {
    it("updates existing requirement", async () => {
      reqModel.getById.mockResolvedValue({ id: 1 });
      reqModel.update.mockResolvedValue({ id: 1, requirement_name: "Updated" });
      const result = await update(1, { requirement_name: "Updated" });
      expect(result.requirement_name).toBe("Updated");
    });

    it("throws when requirement not found", async () => {
      reqModel.getById.mockResolvedValue(null);
      await expect(update(999, {})).rejects.toThrow("Requirement not found");
    });
  });

  describe("remove", () => {
    it("removes existing requirement", async () => {
      reqModel.getById.mockResolvedValue({ id: 1 });
      reqModel.remove.mockResolvedValue({ id: 1 });
      await expect(remove(1)).resolves.toBeDefined();
    });

    it("throws when requirement not found", async () => {
      reqModel.getById.mockResolvedValue(null);
      await expect(remove(999)).rejects.toThrow("Requirement not found");
    });
  });
});
