jest.mock("../models/payroll.model", () => ({
  generatePayroll: jest.fn(),
  getPayroll: jest.fn(),
  getPayrollSummary: jest.fn(),
  getEmployeeSalary: jest.fn(),
  updateEmployeeSalary: jest.fn(),
  getDeductions: jest.fn(),
  createDeduction: jest.fn(),
  updateDeduction: jest.fn(),
  getDeductionById: jest.fn(),
  deleteDeduction: jest.fn(),
  getMyPayroll: jest.fn(),
  getMySalaryDetails: jest.fn(),
  getMyBenefits: jest.fn(),
  getPayrollDetails: jest.fn(),
  lockPayroll: jest.fn(),
  unlockPayroll: jest.fn(),
  voidPayroll: jest.fn(),
  deletePayrollByCutoff: jest.fn(),
}));

jest.mock("../services/queue.service", () => ({
  addPayslipToQueue: jest.fn(),
  addBulkPayslipsToQueue: jest.fn(),
  getQueueStats: jest.fn(),
}));

jest.mock("../services/notificationHelper.service", () => ({
  notifyEmployee: jest.fn(),
}));

jest.mock("../services/notificationDispatch.service", () => ({
  canSendEmail: jest.fn(),
  sendInAppIfEnabled: jest.fn().mockReturnValue({ catch: jest.fn() }),
}));

jest.mock("../config/db", () => ({ query: jest.fn() }));

jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock("../services/notification.service", () => ({
  notify: jest.fn().mockReturnValue({ catch: jest.fn() }),
}));

const payrollModel = require("../models/payroll.model");
const queueService = require("../services/queue.service");
const notificationHelper = require("../services/notificationHelper.service");
const notificationDispatch = require("../services/notificationDispatch.service");
const pool = require("../config/db");
const logger = require("../utils/logger");
const notificationService = require("../services/notification.service");

const {
  getMyBenefits,
  generatePayroll,
  getPayroll,
  getPayrollSummary,
  getEmployeeSalary,
  updateEmployeeSalary,
  getDeductions,
  createDeduction,
  updateDeduction,
  deleteDeduction,
  markAsPaid,
  markAllAsPaid,
  deletePayrollByCutoff,
  getMyPayroll,
  getMySalaryDetails,
  getPayrollDetails,
  getEmployeesWithPayrollForCutoff,
  getQueueStatus,
  lockPayroll,
  unlockPayroll,
  voidPayroll,
} = require("../services/payroll.service");

describe("payroll.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== getEmployeesWithPayrollForCutoff ====================

  describe("getEmployeesWithPayrollForCutoff", () => {
    it("queries pool and returns rows", async () => {
      const rows = [{ id: 1, employee_id: 10, first_name: "John" }];
      pool.query.mockResolvedValue({ rows });

      const result = await getEmployeesWithPayrollForCutoff("2026-01-01", "2026-01-15");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"), ["2026-01-01", "2026-01-15"],
      );
      expect(result).toEqual(rows);
    });

    it("returns empty array when no records", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await getEmployeesWithPayrollForCutoff("2026-01-01", "2026-01-15");
      expect(result).toEqual([]);
    });
  });

  // ==================== generatePayroll ====================

  describe("generatePayroll", () => {
    const cutoff_start = "2026-01-01";
    const cutoff_end = "2026-01-15";
    const pay_date = "2026-01-20";
    const branch_id = 1;

    it("calls model and returns result with message (no admin notify)", async () => {
      const modelResult = { message: "No employees found for cutoff" };
      payrollModel.generatePayroll.mockResolvedValue(modelResult);

      const result = await generatePayroll(cutoff_start, cutoff_end, pay_date, branch_id);
      expect(payrollModel.generatePayroll).toHaveBeenCalledWith(cutoff_start, cutoff_end, pay_date, branch_id);
      expect(pool.query).not.toHaveBeenCalled();
      expect(result).toEqual(modelResult);
    });

    it("calls model and notifies admins when result has no message", async () => {
      const modelResult = { count: 5 };
      payrollModel.generatePayroll.mockResolvedValue(modelResult);
      pool.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });

      const result = await generatePayroll(cutoff_start, cutoff_end, pay_date, branch_id);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("SELECT"));
      expect(notificationService.notify).toHaveBeenCalledTimes(2);
      expect(notificationService.notify).toHaveBeenCalledWith({
        user_id: 1,
        type: "PAYROLL",
        title: "Payroll Generated",
        message: "Your payroll for the selected cutoff has been generated and is ready for review.",
        reference_id: null,
        meta: { cutoff_start, cutoff_end, branch_id },
      });
      expect(notificationService.notify).toHaveBeenCalledWith({
        user_id: 2,
        type: "PAYROLL",
        title: "Payroll Generated",
        message: "Your payroll for the selected cutoff has been generated and is ready for review.",
        reference_id: null,
        meta: { cutoff_start, cutoff_end, branch_id },
      });
      expect(result).toEqual(modelResult);
    });

    it("does not notify when no admin users exist", async () => {
      payrollModel.generatePayroll.mockResolvedValue({ count: 5 });
      pool.query.mockResolvedValue({ rows: [] });

      const result = await generatePayroll(cutoff_start, cutoff_end, pay_date, branch_id);
      expect(notificationService.notify).not.toHaveBeenCalled();
      expect(result).toEqual({ count: 5 });
    });

    it("notifies even when pool query returns no rows property gracefully", async () => {
      payrollModel.generatePayroll.mockResolvedValue({});
      pool.query.mockResolvedValue({ rows: [{ id: 99 }] });

      const result = await generatePayroll(cutoff_start, cutoff_end, pay_date, branch_id);
      expect(notificationService.notify).toHaveBeenCalledTimes(1);
      expect(result).toEqual({});
    });
  });

  // ==================== getPayroll ====================

  describe("getPayroll", () => {
    it("delegates to model with correct args", async () => {
      payrollModel.getPayroll.mockResolvedValue([{ id: 1 }]);
      const result = await getPayroll("cs", "ce", 1, 10, "search", [1, 2]);
      expect(payrollModel.getPayroll).toHaveBeenCalledWith("cs", "ce", 1, 10, "search", [1, 2]);
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  // ==================== getPayrollSummary ====================

  describe("getPayrollSummary", () => {
    it("delegates to model with correct args", async () => {
      payrollModel.getPayrollSummary.mockResolvedValue({ total: 100 });
      const result = await getPayrollSummary("cs", "ce", [1]);
      expect(payrollModel.getPayrollSummary).toHaveBeenCalledWith("cs", "ce", [1]);
      expect(result).toEqual({ total: 100 });
    });
  });

  // ==================== getEmployeeSalary ====================

  describe("getEmployeeSalary", () => {
    it("delegates to model with correct args", async () => {
      payrollModel.getEmployeeSalary.mockResolvedValue([{ id: 1, salary: 50000 }]);
      const result = await getEmployeeSalary(1, 10, "search", [1]);
      expect(payrollModel.getEmployeeSalary).toHaveBeenCalledWith(1, 10, "search", [1]);
      expect(result).toEqual([{ id: 1, salary: 50000 }]);
    });
  });

  // ==================== updateEmployeeSalary ====================

  describe("updateEmployeeSalary", () => {
    it("delegates to model with correct args", async () => {
      payrollModel.updateEmployeeSalary.mockResolvedValue({ id: 1, salary: 60000 });
      const result = await updateEmployeeSalary(1, { salary: 60000 });
      expect(payrollModel.updateEmployeeSalary).toHaveBeenCalledWith(1, { salary: 60000 });
      expect(result).toEqual({ id: 1, salary: 60000 });
    });
  });

  // ==================== getDeductions ====================

  describe("getDeductions", () => {
    it("delegates to model with correct args", async () => {
      payrollModel.getDeductions.mockResolvedValue([{ id: 1, name: "SSS" }]);
      const result = await getDeductions(5);
      expect(payrollModel.getDeductions).toHaveBeenCalledWith(5);
      expect(result).toEqual([{ id: 1, name: "SSS" }]);
    });
  });

  // ==================== createDeduction ====================

  describe("createDeduction", () => {
    it("delegates to model with correct args", async () => {
      const data = { employee_id: 5, name: "SSS", amount: 1000 };
      payrollModel.createDeduction.mockResolvedValue({ id: 1, ...data });
      const result = await createDeduction(data);
      expect(payrollModel.createDeduction).toHaveBeenCalledWith(data);
      expect(result).toEqual({ id: 1, ...data });
    });
  });

  // ==================== updateDeduction ====================

  describe("updateDeduction", () => {
    it("delegates to model with correct args", async () => {
      payrollModel.updateDeduction.mockResolvedValue({ id: 1, amount: 2000 });
      const result = await updateDeduction(1, { amount: 2000 });
      expect(payrollModel.updateDeduction).toHaveBeenCalledWith(1, { amount: 2000 });
      expect(result).toEqual({ id: 1, amount: 2000 });
    });
  });

  // ==================== deleteDeduction ====================

  describe("deleteDeduction", () => {
    it("throws when deduction not found", async () => {
      payrollModel.getDeductionById.mockResolvedValue(null);
      await expect(deleteDeduction(99)).rejects.toThrow("Deduction not found");
      expect(payrollModel.deleteDeduction).not.toHaveBeenCalled();
    });

    it("throws 409 with metadata when employee has finalized payroll records", async () => {
      payrollModel.getDeductionById.mockResolvedValue({ id: 1, employee_id: 5, name: "SSS" });
      pool.query.mockResolvedValue({ rows: [{ cnt: "3" }] });

      let err;
      try {
        await deleteDeduction(1);
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.message).toBe("Cannot delete deduction: this employee has finalized payroll records that include this deduction. Deactivate the deduction instead.");
      expect(err.statusCode).toBe(409);
      expect(err.dependencies).toEqual([{ entity: "payroll", label: "finalized payroll records" }]);
      expect(err.recommendation).toBe("Set the deduction as inactive instead of deleting it");
      expect(payrollModel.deleteDeduction).not.toHaveBeenCalled();
    });

    it("deletes deduction when no conflicts exist", async () => {
      payrollModel.getDeductionById.mockResolvedValue({ id: 1, employee_id: 5, name: "SSS" });
      pool.query.mockResolvedValue({ rows: [{ cnt: "0" }] });
      payrollModel.deleteDeduction.mockResolvedValue({ id: 1 });

      const result = await deleteDeduction(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT COUNT(*)"), [5],
      );
      expect(payrollModel.deleteDeduction).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  // ==================== markAsPaid ====================

  describe("markAsPaid", () => {
    it("updates payroll to PAID and processes employee with email and queue", async () => {
      const payrollRow = { id: 1, employee_id: 10, cutoff_start: "2026-01-01", cutoff_end: "2026-01-15" };
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [payrollRow] });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 10, first_name: "John", last_name: "Doe", email: "john@test.com", employee_code: "E001" }] });
      notificationDispatch.canSendEmail.mockResolvedValue(true);

      const result = await markAsPaid(1, 42);

      expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining("UPDATE payroll"), [1, 42]);
      expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining("SELECT"), [10]);
      expect(notificationDispatch.canSendEmail).toHaveBeenCalledWith("payroll_marked_paid");
      expect(queueService.addPayslipToQueue).toHaveBeenCalledWith(
        payrollRow, { id: 10, first_name: "John", last_name: "Doe", email: "john@test.com", employee_code: "E001" },
      );
      expect(notificationDispatch.sendInAppIfEnabled).toHaveBeenCalledWith(
        "payroll_marked_paid", expect.any(Function),
      );
      expect(result).toEqual(payrollRow);
    });

    it("skips queue when employee has email but canSendEmail is false", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, employee_id: 10 }] });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 10, email: "john@test.com" }] });
      notificationDispatch.canSendEmail.mockResolvedValue(false);

      await markAsPaid(1, 42);

      expect(queueService.addPayslipToQueue).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "[payroll] Payslip email disabled for payroll_marked_paid, skipping queue",
      );
    });

    it("skips queue when employee has no email", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, employee_id: 10 }] });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 10, email: null }] });

      await markAsPaid(1, 42);

      expect(notificationDispatch.canSendEmail).not.toHaveBeenCalled();
      expect(queueService.addPayslipToQueue).not.toHaveBeenCalled();
      expect(notificationDispatch.sendInAppIfEnabled).toHaveBeenCalled();
    });

    it("returns undefined when no payroll row updated", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const result = await markAsPaid(1, 42);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(notificationDispatch.sendInAppIfEnabled).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  // ==================== markAllAsPaid ====================

  describe("markAllAsPaid", () => {
    const cutoff_start = "2026-01-01";
    const cutoff_end = "2026-01-15";
    const userId = 42;

    it("throws when no payroll records exist for cutoff", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await expect(markAllAsPaid(cutoff_start, cutoff_end, userId)).rejects.toThrow("Please generate payroll first.");
    });

    it("throws when all payrolls are already PAID", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ status: "PAID", cnt: 5 }] });
      await expect(markAllAsPaid(cutoff_start, cutoff_end, userId)).rejects.toThrow("Payroll is already paid.");
    });

    it("throws when all payrolls are LOCKED", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ status: "LOCKED", cnt: 3 }] });
      await expect(markAllAsPaid(cutoff_start, cutoff_end, userId)).rejects.toThrow("Payroll is locked and cannot be marked as paid.");
    });

    it("throws when all payrolls are VOID", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ status: "VOID", cnt: 2 }] });
      await expect(markAllAsPaid(cutoff_start, cutoff_end, userId)).rejects.toThrow("Payroll is voided and cannot be marked as paid.");
    });

    it("processes mixed UNPAID and PAID - updating only UNPAID", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ status: "UNPAID", cnt: 2 }, { status: "PAID", cnt: 1 }] });

      const updatedRows = [
        { id: 1, employee_id: 10, cutoff_start, cutoff_end },
        { id: 2, employee_id: 20, cutoff_start, cutoff_end },
      ];
      pool.query.mockResolvedValueOnce({ rowCount: 2, rows: updatedRows });
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 10, first_name: "John", last_name: "Doe", email: "john@test.com", employee_code: "E001" },
          { id: 20, first_name: "Jane", last_name: "Smith", email: "jane@test.com", employee_code: "E002" },
        ],
      });
      notificationDispatch.canSendEmail.mockResolvedValue(true);

      const result = await markAllAsPaid(cutoff_start, cutoff_end, userId);

      expect(result).toEqual({ message: "All payroll marked as paid", count: 2, emailsQueued: 2 });
      expect(queueService.addBulkPayslipsToQueue).toHaveBeenCalledWith([
        { payroll: updatedRows[0], employee: { id: 10, first_name: "John", last_name: "Doe", email: "john@test.com", employee_code: "E001" } },
        { payroll: updatedRows[1], employee: { id: 20, first_name: "Jane", last_name: "Smith", email: "jane@test.com", employee_code: "E002" } },
      ]);
      expect(notificationDispatch.sendInAppIfEnabled).toHaveBeenCalledTimes(2);
    });

    it("skips queuing when employee emails missing", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ status: "UNPAID", cnt: 2 }] });

      const updatedRows = [
        { id: 1, employee_id: 10, cutoff_start, cutoff_end },
        { id: 2, employee_id: 20, cutoff_start, cutoff_end },
      ];
      pool.query.mockResolvedValueOnce({ rowCount: 2, rows: updatedRows });
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 10, email: null },
          { id: 20, email: null },
        ],
      });

      const result = await markAllAsPaid(cutoff_start, cutoff_end, userId);

      expect(result).toEqual({ message: "All payroll marked as paid", count: 2, emailsQueued: 0 });
      expect(queueService.addBulkPayslipsToQueue).not.toHaveBeenCalled();
      expect(notificationDispatch.sendInAppIfEnabled).toHaveBeenCalledTimes(2);
    });

    it("skips queue when email is disabled", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ status: "UNPAID", cnt: 1 }] });
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, employee_id: 10, cutoff_start, cutoff_end }] });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 10, email: "john@test.com" }] });
      notificationDispatch.canSendEmail.mockResolvedValue(false);

      const result = await markAllAsPaid(cutoff_start, cutoff_end, userId);

      expect(result.emailsQueued).toBe(1);
      expect(queueService.addBulkPayslipsToQueue).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith("[payroll] Bulk payslip email disabled for payroll_marked_paid, skipping queue");
    });

    it("throws with proper error for edge case where check returns only LOCKED", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ status: "LOCKED", cnt: 1 }, { status: "UNPAID", cnt: 0 }] });
      await expect(markAllAsPaid(cutoff_start, cutoff_end, userId)).rejects.toThrow("Payroll is locked");
    });
  });

  // ==================== getQueueStatus ====================

  describe("getQueueStatus", () => {
    it("delegates to queueService.getQueueStats", async () => {
      queueService.getQueueStats.mockResolvedValue({ waiting: 1, active: 2 });
      const result = await getQueueStatus();
      expect(queueService.getQueueStats).toHaveBeenCalledWith();
      expect(result).toEqual({ waiting: 1, active: 2 });
    });
  });

  // ==================== deletePayrollByCutoff ====================

  describe("deletePayrollByCutoff", () => {
    it("throws 409 when version snapshots exist", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await expect(deletePayrollByCutoff("cs", "ce", "pd")).rejects.toThrow(
        "Cannot delete payroll: version snapshots exist",
      );
      expect(payrollModel.deletePayrollByCutoff).not.toHaveBeenCalled();
    });

    it("calls model.deletePayrollByCutoff when no versions exist", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      payrollModel.deletePayrollByCutoff.mockResolvedValue({ deleted: 5 });

      const result = await deletePayrollByCutoff("cs", "ce", "pd");
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("payroll_versions"), ["cs", "ce", "pd"]);
      expect(payrollModel.deletePayrollByCutoff).toHaveBeenCalledWith("cs", "ce", "pd");
      expect(result).toEqual({ deleted: 5 });
    });
  });

  // ==================== getMyPayroll ====================

  describe("getMyPayroll", () => {
    it("delegates to model with correct args", async () => {
      payrollModel.getMyPayroll.mockResolvedValue([{ id: 1 }]);
      const result = await getMyPayroll(10, "cs", "ce");
      expect(payrollModel.getMyPayroll).toHaveBeenCalledWith(10, "cs", "ce");
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  // ==================== getMySalaryDetails ====================

  describe("getMySalaryDetails", () => {
    it("delegates to model with correct args", async () => {
      payrollModel.getMySalaryDetails.mockResolvedValue({ salary: 50000 });
      const result = await getMySalaryDetails(10);
      expect(payrollModel.getMySalaryDetails).toHaveBeenCalledWith(10);
      expect(result).toEqual({ salary: 50000 });
    });
  });

  // ==================== getMyBenefits ====================

  describe("getMyBenefits", () => {
    it("delegates to model with correct args", async () => {
      payrollModel.getMyBenefits.mockResolvedValue([{ name: "SSS" }]);
      const result = await getMyBenefits(10);
      expect(payrollModel.getMyBenefits).toHaveBeenCalledWith(10);
      expect(result).toEqual([{ name: "SSS" }]);
    });
  });

  // ==================== getPayrollDetails ====================

  describe("getPayrollDetails", () => {
    it("delegates to model with correct args", async () => {
      payrollModel.getPayrollDetails.mockResolvedValue({ id: 1, gross: 50000 });
      const result = await getPayrollDetails(1);
      expect(payrollModel.getPayrollDetails).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, gross: 50000 });
    });
  });

  // ==================== lockPayroll ====================

  describe("lockPayroll", () => {
    it("delegates to model with id and userId", async () => {
      payrollModel.lockPayroll.mockResolvedValue({ id: 1, status: "LOCKED" });
      const result = await lockPayroll(1, 42);
      expect(payrollModel.lockPayroll).toHaveBeenCalledWith(1, 42);
      expect(result).toEqual({ id: 1, status: "LOCKED" });
    });

    it("delegates to model without userId", async () => {
      payrollModel.lockPayroll.mockResolvedValue({ id: 1, status: "LOCKED" });
      await lockPayroll(1);
      expect(payrollModel.lockPayroll).toHaveBeenCalledWith(1, null);
    });
  });

  // ==================== unlockPayroll ====================

  describe("unlockPayroll", () => {
    it("delegates to model", async () => {
      payrollModel.unlockPayroll.mockResolvedValue({ id: 1, status: "UNPAID" });
      const result = await unlockPayroll(1);
      expect(payrollModel.unlockPayroll).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, status: "UNPAID" });
    });
  });

  // ==================== voidPayroll ====================

  describe("voidPayroll", () => {
    it("delegates to model with id and userId", async () => {
      payrollModel.voidPayroll.mockResolvedValue({ id: 1, status: "VOID" });
      const result = await voidPayroll(1, 42);
      expect(payrollModel.voidPayroll).toHaveBeenCalledWith(1, 42);
      expect(result).toEqual({ id: 1, status: "VOID" });
    });

    it("delegates to model without userId", async () => {
      payrollModel.voidPayroll.mockResolvedValue({ id: 1, status: "VOID" });
      await voidPayroll(1);
      expect(payrollModel.voidPayroll).toHaveBeenCalledWith(1, null);
    });
  });
});
