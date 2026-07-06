jest.mock("../models/employeeOnboarding.model", () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));
jest.mock("../models/employee.model", () => ({
  getEmployeeById: jest.fn(),
}));

const onboardingModel = require("../models/employeeOnboarding.model");
const employeeModel = require("../models/employee.model");
const {
  getAll,
  getById,
  create,
  update,
} = require("../services/employeeOnboarding.service");

describe("employeeOnboarding.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns paginated onboarding records", async () => {
      onboardingModel.getAll.mockResolvedValue({ data: [{ id: 1 }], pagination: { total: 1 } });
      const result = await getAll(1, 10, "", "");
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getById", () => {
    it("returns onboarding when found", async () => {
      onboardingModel.getById.mockResolvedValue({ id: 1, status: "PENDING" });
      const result = await getById(1);
      expect(result.status).toBe("PENDING");
    });

    it("throws when onboarding not found", async () => {
      onboardingModel.getById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Onboarding record not found");
    });
  });

  describe("create", () => {
    it("creates onboarding for existing employee", async () => {
      employeeModel.getEmployeeById.mockResolvedValue({ id: 1 });
      onboardingModel.create.mockResolvedValue({ id: 1, employee_id: 1, status: "PENDING" });
      const result = await create({ employee_id: 1 });
      expect(result.id).toBe(1);
    });

    it("throws when employee_id missing", async () => {
      await expect(create({})).rejects.toThrow("Employee ID is required");
    });

    it("throws when employee not found", async () => {
      employeeModel.getEmployeeById.mockResolvedValue(null);
      await expect(create({ employee_id: 999 })).rejects.toThrow("Employee not found");
    });
  });

  describe("update", () => {
    it("updates existing onboarding", async () => {
      onboardingModel.getById.mockResolvedValue({ id: 1 });
      onboardingModel.update.mockResolvedValue({ id: 1, status: "COMPLETED" });
      const result = await update(1, { status: "COMPLETED" });
      expect(result.status).toBe("COMPLETED");
    });

    it("throws when onboarding not found", async () => {
      onboardingModel.getById.mockResolvedValue(null);
      await expect(update(999, {})).rejects.toThrow("Onboarding record not found");
    });
  });
});
