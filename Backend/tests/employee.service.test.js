jest.mock("../models/employee.model", () => ({
  getEmployees: jest.fn(),
  getEmployeeById: jest.fn(),
  getDepartments: jest.fn(),
  getPositions: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  getProbationaryEmployeesDueForRegularization: jest.fn(),
  regularizeEmployee: jest.fn(),
  getEmploymentStats: jest.fn(),
  searchEmployees: jest.fn(),
  deleteEmployee: jest.fn(),
}));
jest.mock("../config/db", () => {
  const mClient = { query: jest.fn(), release: jest.fn() };
  return { query: jest.fn(), connect: jest.fn().mockResolvedValue(mClient) };
});
jest.mock("../services/applicant.service", () => ({ generateEmployeeCode: jest.fn() }));
jest.mock("../services/employeeInit.service", () => ({ initializeNewEmployee: jest.fn() }));
jest.mock("../services/notificationHelper.service", () => ({ notifyUsersWithPermission: jest.fn().mockReturnValue({ catch: jest.fn() }) }));
jest.mock("../utils/logger", () => ({ error: jest.fn() }));

const model = require("../models/employee.model");
const pool = require("../config/db");
const applicantService = require("../services/applicant.service");
const employeeInitService = require("../services/employeeInit.service");
const notificationHelper = require("../services/notificationHelper.service");
const {
  getEmployees, createEmployee, updateEmployee, getEmployeeById,
  getProbationaryEmployeesDueForRegularization, approveRegularization,
  getEmploymentStats, getFilterOptions, searchEmployees, deleteEmployee,
} = require("../services/employee.service");

describe("employee.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("getEmployees", () => {
    it("returns employees", async () => {
      model.getEmployees.mockResolvedValue([{ id: 1 }]);
      expect(await getEmployees(1, 10, "", "", [], "")).toHaveLength(1);
    });
  });

  describe("getEmployeeById", () => {
    it("returns employee by id", async () => {
      model.getEmployeeById.mockResolvedValue({ id: 1 });
      expect(await getEmployeeById(1)).toEqual({ id: 1 });
    });
  });

  describe("getFilterOptions", () => {
    it("returns departments and positions", async () => {
      model.getDepartments.mockResolvedValue(["IT"]);
      model.getPositions.mockResolvedValue(["Dev"]);
      const result = await getFilterOptions();
      expect(result.departments).toEqual(["IT"]);
      expect(result.positions).toEqual(["Dev"]);
    });
  });

  describe("createEmployee", () => {
    it("generates code when not provided", async () => {
      applicantService.generateEmployeeCode.mockResolvedValue({ code: "EMP001", number: 1 });
      model.createEmployee.mockResolvedValue({ id: 1, first_name: "John", last_name: "Doe", employee_code: "EMP001" });
      const client = await pool.connect();
      client.query.mockResolvedValue({});
      const result = await createEmployee({});
      expect(result.id).toBe(1);
      expect(employeeInitService.initializeNewEmployee).toHaveBeenCalledWith(1, client);
    });

    it("throws when probation period invalid", async () => {
      await expect(createEmployee({ employment_status: "PROBATIONARY", probation_period_months: 0 })).rejects.toThrow("Probation period must be greater than 0");
    });

    it("throws when regularization before hire date", async () => {
      applicantService.generateEmployeeCode.mockResolvedValue({ code: "EMP001", number: 1 });
      await expect(createEmployee({
        regularization_date: "2025-01-01", hired_date: "2025-06-01",
        employment_status: "PROBATIONARY",
      })).rejects.toThrow("Regularization date cannot be before hire date");
    });
  });

  describe("updateEmployee", () => {
    it("updates employee without branch change", async () => {
      model.getEmployeeById.mockResolvedValue({ id: 1, branch_id: 1 });
      model.updateEmployee.mockResolvedValue({ id: 1 });
      const result = await updateEmployee(1, { first_name: "Updated" });
      expect(result.id).toBe(1);
    });

    it("updates employee with branch change", async () => {
      model.getEmployeeById.mockResolvedValue({ id: 1, branch_id: 1, employee_code: "EMP001", status: "ACTIVE" });
      model.updateEmployee.mockResolvedValue({ id: 1 });
      const client = await pool.connect();
      client.query.mockResolvedValueOnce({}); // BEGIN
      client.query.mockResolvedValueOnce({ rows: [] }); // user query
      client.query.mockResolvedValueOnce({}); // COMMIT
      const result = await updateEmployee(1, { branch_id: 2 });
      expect(result.id).toBe(1);
    });

    it("throws when regularization before hire date", async () => {
      model.getEmployeeById.mockResolvedValue({ id: 1, branch_id: 1 });
      await expect(updateEmployee(1, { regularization_date: "2025-01-01", hired_date: "2025-06-01" })).rejects.toThrow("Regularization date cannot be before hire date");
    });

    it("throws when probation period invalid", async () => {
      model.getEmployeeById.mockResolvedValue({ id: 1, branch_id: 1 });
      await expect(updateEmployee(1, { employment_status: "PROBATIONARY", probation_period_months: 0 })).rejects.toThrow("Probation period must be greater than 0");
    });
  });

  describe("getProbationaryEmployeesDueForRegularization", () => {
    it("returns due employees", async () => {
      model.getProbationaryEmployeesDueForRegularization.mockResolvedValue([{ id: 1 }]);
      expect(await getProbationaryEmployeesDueForRegularization([1])).toHaveLength(1);
    });
  });

  describe("approveRegularization", () => {
    it("throws when employee not found", async () => {
      model.getEmployeeById.mockResolvedValue(null);
      await expect(approveRegularization(1)).rejects.toThrow("Employee not found");
    });
    it("throws when not probationary", async () => {
      model.getEmployeeById.mockResolvedValue({ id: 1, employment_status: "REGULAR" });
      await expect(approveRegularization(1)).rejects.toThrow("not on probationary status");
    });
    it("approves regularization", async () => {
      model.getEmployeeById.mockResolvedValue({ id: 1, employment_status: "PROBATIONARY" });
      model.regularizeEmployee.mockResolvedValue({ id: 1, employment_status: "REGULAR" });
      const result = await approveRegularization(1);
      expect(result.employment_status).toBe("REGULAR");
    });
  });

  describe("getEmploymentStats", () => {
    it("returns stats", async () => {
      model.getEmploymentStats.mockResolvedValue({ total: 10 });
      expect(await getEmploymentStats([1])).toEqual({ total: 10 });
    });
  });

  describe("searchEmployees", () => {
    it("searches employees", async () => {
      model.searchEmployees.mockResolvedValue([{ id: 1 }]);
      expect(await searchEmployees({})).toHaveLength(1);
    });
  });

  describe("deleteEmployee", () => {
    it("deletes employee", async () => {
      await expect(deleteEmployee(1)).resolves.toBeUndefined();
      expect(model.deleteEmployee).toHaveBeenCalledWith(1);
    });
  });
});
