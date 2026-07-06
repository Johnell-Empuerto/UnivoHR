jest.mock("bull", () => {
  const mQueue = {
    add: jest.fn(),
    addBulk: jest.fn(),
    getWaitingCount: jest.fn(),
    getActiveCount: jest.fn(),
    getCompletedCount: jest.fn(),
    getFailedCount: jest.fn(),
    getDelayedCount: jest.fn(),
    getFailed: jest.fn(),
  };
  return jest.fn(() => mQueue);
});
jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));

const {
  payslipQueue,
  addPayslipToQueue,
  addBulkPayslipsToQueue,
  getQueueStats,
  cleanFailedJobs,
  hrFormQueue,
  addBulkAssignmentJob,
} = require("../services/queue.service");

describe("queue.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("addPayslipToQueue", () => {
    it("adds a payslip job", async () => {
      payslipQueue.add.mockResolvedValue({ id: 1 });
      const result = await addPayslipToQueue({ id: 1 }, { email: "test@test.com" });
      expect(result.id).toBe(1);
      expect(payslipQueue.add).toHaveBeenCalledWith(
        "send-payslip", { payroll: { id: 1 }, employee: { email: "test@test.com" } }, { delay: 1000 },
      );
    });
  });

  describe("addBulkPayslipsToQueue", () => {
    it("adds multiple payslip jobs", async () => {
      payslipQueue.addBulk.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const items = [
        { payroll: { id: 1 }, employee: { email: "a@a.com" } },
        { payroll: { id: 2 }, employee: { email: "b@b.com" } },
      ];
      const result = await addBulkPayslipsToQueue(items);
      expect(result).toHaveLength(2);
    });
  });

  describe("getQueueStats", () => {
    it("returns queue statistics", async () => {
      payslipQueue.getWaitingCount.mockResolvedValue(1);
      payslipQueue.getActiveCount.mockResolvedValue(2);
      payslipQueue.getCompletedCount.mockResolvedValue(3);
      payslipQueue.getFailedCount.mockResolvedValue(4);
      payslipQueue.getDelayedCount.mockResolvedValue(5);
      const stats = await getQueueStats();
      expect(stats).toEqual({ waiting: 1, active: 2, completed: 3, failed: 4, delayed: 5, total: 15 });
    });
  });

  describe("cleanFailedJobs", () => {
    it("removes all failed jobs", async () => {
      const remove1 = jest.fn();
      const remove2 = jest.fn();
      payslipQueue.getFailed.mockResolvedValue([{ remove: remove1 }, { remove: remove2 }]);
      const result = await cleanFailedJobs();
      expect(result.cleaned).toBe(2);
    });
  });

  describe("addBulkAssignmentJob", () => {
    it("adds hr form assignment job", async () => {
      hrFormQueue.add.mockResolvedValue({ id: 1 });
      const result = await addBulkAssignmentJob(1, [1, 2], 1, "2026-01-01");
      expect(result.id).toBe(1);
      expect(hrFormQueue.add).toHaveBeenCalledWith("bulk-assign", {
        formId: 1, employeeIds: [1, 2], userId: 1, dueDate: "2026-01-01",
      });
    });
  });
});
