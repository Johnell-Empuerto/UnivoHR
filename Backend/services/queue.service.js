const Queue = require("bull");
const pool = require("../config/db");

// Create payslip email queue (NO PROCESSING HERE - moved to worker.js)
const payslipQueue = new Queue("payslip-emails", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Add job to queue
const addPayslipToQueue = async (payroll, employee) => {
  const job = await payslipQueue.add(
    "send-payslip",
    {
      payroll,
      employee,
    },
    {
      delay: 1000,
    },
  );

  console.log(
    ` Added payslip for ${employee.email} to queue (Job ID: ${job.id})`,
  );
  return job;
};

// Add multiple payslips to queue
const addBulkPayslipsToQueue = async (payrolls) => {
  const bulkData = payrolls.map((item) => ({
    name: "send-payslip",
    data: {
      payroll: item.payroll,
      employee: item.employee,
    },
    opts: {
      delay: 0,
    },
  }));

  const jobs = await payslipQueue.addBulk(bulkData);

  console.log(`📬 Added ${jobs.length} payslips to queue via addBulk`);
  return jobs;
};

// Get queue stats
const getQueueStats = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    payslipQueue.getWaitingCount(),
    payslipQueue.getActiveCount(),
    payslipQueue.getCompletedCount(),
    payslipQueue.getFailedCount(),
    payslipQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
};

// Clean failed jobs
const cleanFailedJobs = async () => {
  const failedJobs = await payslipQueue.getFailed();
  for (const job of failedJobs) {
    await job.remove();
  }
  return { cleaned: failedJobs.length };
};

// Create HR Form assignment queue
const hrFormQueue = new Queue("hr-form-assignments", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const addBulkAssignmentJob = async (formId, employeeIds, userId, dueDate) => {
  const job = await hrFormQueue.add("bulk-assign", { formId, employeeIds, userId, dueDate });
  console.log(`[Queue] Added bulk assignment for form ${formId} to ${employeeIds.length} employees (Job ID: ${job.id})`);
  return job;
};

module.exports = {
  payslipQueue,
  addPayslipToQueue,
  addBulkPayslipsToQueue,
  getQueueStats,
  cleanFailedJobs,
  hrFormQueue,
  addBulkAssignmentJob,
};
