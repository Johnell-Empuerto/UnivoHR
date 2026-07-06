jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../models/leaveCredit.model", () => ({
  getByEmployee: jest.fn(),
  createDefault: jest.fn(),
}));

const pool = require("../config/db");
const leaveCreditModel = require("../models/leaveCredit.model");
const {
  getMyCredits,
  getAllCredits,
  getEmployeeCredits,
  updateCredits,
} = require("../services/leaveCredit.service");

describe("leaveCredit.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("getMyCredits", () => {
    it("returns credits with computed remaining fields", async () => {
      leaveCreditModel.getByEmployee.mockResolvedValue({
        sick_leave: 10, used_sick_leave: 2,
        vacation_leave: 15, used_vacation_leave: 3,
        maternity_leave: 60, used_maternity_leave: 0,
        emergency_leave: 5, used_emergency_leave: 1,
      });
      const result = await getMyCredits(1);
      expect(result.sick_leave_remaining).toBe(8);
      expect(result.vacation_leave_remaining).toBe(12);
      expect(result.maternity_leave_remaining).toBe(60);
      expect(result.emergency_leave_remaining).toBe(4);
    });

    it("creates default credits when none exist", async () => {
      leaveCreditModel.getByEmployee.mockResolvedValue(null);
      leaveCreditModel.createDefault.mockResolvedValue({
        sick_leave: 5, used_sick_leave: 0,
        vacation_leave: 5, used_vacation_leave: 0,
        maternity_leave: 0, used_maternity_leave: 0,
        emergency_leave: 0, used_emergency_leave: 0,
      });
      const result = await getMyCredits(1);
      expect(result.sick_leave_remaining).toBe(5);
      expect(leaveCreditModel.createDefault).toHaveBeenCalledWith(1);
    });

    it("returns null when credit creation fails", async () => {
      leaveCreditModel.getByEmployee.mockResolvedValue(null);
      leaveCreditModel.createDefault.mockResolvedValue(null);
      const result = await getMyCredits(1);
      expect(result).toBeNull();
    });
  });

  describe("getEmployeeCredits", () => {
    it("returns credits same as getMyCredits", async () => {
      leaveCreditModel.getByEmployee.mockResolvedValue({
        sick_leave: 10, used_sick_leave: 2,
        vacation_leave: 15, used_vacation_leave: 3,
        maternity_leave: 60, used_maternity_leave: 0,
        emergency_leave: 5, used_emergency_leave: 1,
      });
      const result = await getEmployeeCredits(1);
      expect(result.sick_leave_remaining).toBe(8);
    });
  });

  describe("getAllCredits", () => {
    const employeeRow = { id: 1, first_name: "John", last_name: "Doe", middle_name: null, suffix: null, employee_code: "EMP001", department: "IT", position: "Dev" };

    it("returns paginated credits with balances", async () => {
      pool.query.mockResolvedValueOnce({ rows: [employeeRow] });
      pool.query.mockResolvedValueOnce({ rows: [
        { employee_id: 1, code: "SL", name: "Sick", sort_order: 1, is_unlimited: false, requires_balance: true, include_in_credits: true, is_paid: true, total_days: 10, used_days: 2, carried_over_days: 0, adjusted_days: 0 },
      ] });
      pool.query.mockResolvedValueOnce({ rows: [{ cnt: 1 }] });

      const result = await getAllCredits(1, 10, "", "");
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.data[0].sick_leave).toBe(10);
      expect(result.data[0].sick_leave_remaining).toBe(8);
    });

    it("returns empty data when no employees match", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await getAllCredits(1, 10, "nonexistent", "");
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe("updateCredits", () => {
    it("updates balances array", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      pool.query.mockResolvedValueOnce({ rows: [] });
      leaveCreditModel.getByEmployee.mockResolvedValue({
        sick_leave: 15, used_sick_leave: 0,
        vacation_leave: 5, used_vacation_leave: 0,
        maternity_leave: 0, used_maternity_leave: 0,
        emergency_leave: 0, used_emergency_leave: 0,
      });
      const result = await updateCredits(1, { balances: [{ code: "SL", total_days: 15 }] });
      expect(result.sick_leave).toBe(15);
    });

    it("updates legacy field format", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
      pool.query.mockResolvedValueOnce({ rows: [] });
      leaveCreditModel.getByEmployee.mockResolvedValue({
        sick_leave: 20, used_sick_leave: 0,
        vacation_leave: 10, used_vacation_leave: 0,
        maternity_leave: 0, used_maternity_leave: 0,
        emergency_leave: 0, used_emergency_leave: 0,
      });
      const result = await updateCredits(1, { sick_leave: 20, vacation_leave: 10 });
      expect(result.sick_leave).toBe(20);
      expect(pool.query).toHaveBeenCalledTimes(4);
    });
  });
});
