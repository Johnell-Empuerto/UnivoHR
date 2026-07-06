jest.mock("../models/employeeWorkExperience.model", () => ({
  getAllByEmployeeId: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("../models/employee.model", () => ({
  getEmployeeById: jest.fn(),
}));

const model = require("../models/employeeWorkExperience.model");
const employeeModel = require("../models/employee.model");
const {
  getByEmployeeId,
  create,
  update,
  remove,
} = require("../services/employeeWorkExperience.service");

describe("employeeWorkExperience.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByEmployeeId", () => {
    it("returns work experiences for employee", async () => {
      model.getAllByEmployeeId.mockResolvedValue([{ id: 1, company_name: "ACME" }]);
      const result = await getByEmployeeId(1);
      expect(result).toHaveLength(1);
      expect(result[0].company_name).toBe("ACME");
    });
  });

  describe("create", () => {
    it("creates work experience for existing employee", async () => {
      employeeModel.getEmployeeById.mockResolvedValue({ id: 1 });
      model.create.mockResolvedValue({ id: 1, company_name: "ACME", position: "Engineer" });
      const result = await create({ employee_id: 1, company_name: "ACME", position: "Engineer" });
      expect(result.id).toBe(1);
    });

    it("throws when employee not found", async () => {
      employeeModel.getEmployeeById.mockResolvedValue(null);
      await expect(create({ employee_id: 999 })).rejects.toThrow("Employee not found");
    });
  });

  describe("update", () => {
    it("updates existing work experience", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      model.update.mockResolvedValue({ id: 1, company_name: "Updated" });
      const result = await update(1, { company_name: "Updated" });
      expect(result.company_name).toBe("Updated");
    });

    it("throws when record not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(update(999, {})).rejects.toThrow("Work experience record not found");
    });
  });

  describe("remove", () => {
    it("removes existing work experience", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      model.remove.mockResolvedValue();
      await expect(remove(1)).resolves.toBeUndefined();
    });

    it("throws when record not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(remove(999)).rejects.toThrow("Work experience record not found");
    });
  });
});
