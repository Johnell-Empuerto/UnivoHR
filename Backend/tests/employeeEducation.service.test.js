jest.mock("../models/employeeEducation.model", () => ({
  getAllByEmployeeId: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("../models/employee.model", () => ({
  getEmployeeById: jest.fn(),
}));

const model = require("../models/employeeEducation.model");
const employeeModel = require("../models/employee.model");
const {
  getByEmployeeId,
  create,
  update,
  remove,
} = require("../services/employeeEducation.service");

describe("employeeEducation.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByEmployeeId", () => {
    it("returns education records for employee", async () => {
      model.getAllByEmployeeId.mockResolvedValue([{ id: 1, school_name: "MIT" }]);
      const result = await getByEmployeeId(1);
      expect(result).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("creates education for existing employee", async () => {
      employeeModel.getEmployeeById.mockResolvedValue({ id: 1 });
      model.create.mockResolvedValue({ id: 1, school_name: "MIT", education_level: "College" });
      const result = await create({ employee_id: 1, school_name: "MIT", education_level: "College" });
      expect(result.id).toBe(1);
    });

    it("throws when employee not found", async () => {
      employeeModel.getEmployeeById.mockResolvedValue(null);
      await expect(create({ employee_id: 999 })).rejects.toThrow("Employee not found");
    });
  });

  describe("update", () => {
    it("updates existing education record", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      model.update.mockResolvedValue({ id: 1, school_name: "Updated" });
      const result = await update(1, { school_name: "Updated" });
      expect(result.school_name).toBe("Updated");
    });

    it("throws when record not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(update(999, {})).rejects.toThrow("Education record not found");
    });
  });

  describe("remove", () => {
    it("removes existing education record", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      model.remove.mockResolvedValue();
      await expect(remove(1)).resolves.toBeUndefined();
    });

    it("throws when record not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(remove(999)).rejects.toThrow("Education record not found");
    });
  });
});
