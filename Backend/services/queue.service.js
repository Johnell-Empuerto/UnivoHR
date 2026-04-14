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
  const jobs = [];
  let delay = 0;

  for (const item of payrolls) {
    const job = await payslipQueue.add(
      "send-payslip",
      {
        payroll: item.payroll,
        employee: item.employee,
      },
      {
        delay: delay,
      },
    );
    jobs.push(job);
    delay += 1500;
    console.log(
      `📬 Added payslip for ${item.employee.email} to queue (Job ID: ${job.id})`,
    );
  }

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

module.exports = {
  payslipQueue,
  addPayslipToQueue,
  addBulkPayslipsToQueue,
  getQueueStats,
  cleanFailedJobs,
};
