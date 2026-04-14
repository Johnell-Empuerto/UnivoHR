// worker.js - Separate process for background jobs
const Queue = require("bull");
const smtpService = require("./services/smtp.service");
const settingService = require("./services/setting.service");
const emailTemplateService = require("./services/emailTemplate.service");
const attendanceNotificationService = require("./services/attendanceNotification.service");
const pool = require("./config/db");
require("dotenv").config();

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(amount || 0));
};

// Helper to format date
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Create payslip email queue (same as main app)
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

// Create attendance notifications queue
const attendanceNotificationQueue = new Queue("attendance-notifications", {
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

// Process payslip emails
payslipQueue.process("send-payslip", async (job) => {
  const { payroll, employee } = job.data;

  console.log(
    `[Worker] Processing payslip for ${employee.email} (Attempt ${job.attemptsMade + 1})`,
  );

  try {
    const notifyKey = "notify_payroll_marked_paid";
    const isEnabled = await settingService.getBoolSetting(notifyKey);

    if (!isEnabled) {
      console.log(`[Worker] Email notification for payroll paid is disabled`);
      return { success: true, skipped: true };
    }

    const companyName =
      (await settingService.getSetting("company_name")) || "UnivoHR";

    const templateType = "PAYROLL_MARKED_PAID";
    const data = {
      employee_name: `${employee.first_name} ${employee.last_name}`,
      company_name: companyName,
      cutoff_start: formatDate(payroll.cutoff_start),
      cutoff_end: formatDate(payroll.cutoff_end),
      net_salary: formatCurrency(payroll.net_salary),
    };

    const { subject, html } = await emailTemplateService.renderEmail(
      templateType,
      data,
    );
    await smtpService.sendEmail(employee.email, subject, html);

    console.log(`[Worker] Payslip email sent to ${employee.email}`);

    // Log success to database
    await pool.query(
      `INSERT INTO email_logs (employee_id, payroll_id, type, status, sent_at)
       VALUES ($1, $2, $3, 'SENT', NOW())`,
      [employee.id, payroll.id, "PAYSLIP"],
    );

    return { success: true };
  } catch (error) {
    console.error(
      `[Worker] Failed to send payslip to ${employee.email}:`,
      error.message,
    );

    // Log failure to database
    await pool.query(
      `INSERT INTO email_logs (employee_id, payroll_id, type, status, error, attempted_at)
       VALUES ($1, $2, $3, 'FAILED', $4, NOW())`,
      [employee.id, payroll.id, "PAYSLIP", error.message],
    );

    throw error;
  }
});

// Queue event listeners
payslipQueue.on("completed", (job, result) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

payslipQueue.on("failed", (job, err) => {
  console.error(
    `[Worker] Job ${job.id} failed after ${job.attemptsMade} attempts:`,
    err.message,
  );
});

payslipQueue.on("error", (err) => {
  console.error("[Worker] Queue error:", err);
});

// Process attendance notification checks
attendanceNotificationQueue.process("check-late-notices", async (job) => {
  const { threshold } = job.data;
  console.log(`[Worker] Checking late notices (threshold: ${threshold})`);
  const result =
    await attendanceNotificationService.checkAndSendLateNotices(threshold);
  return result;
});

attendanceNotificationQueue.process(
  "check-absent-without-leave",
  async (job) => {
    console.log(`[Worker] Checking absent without leave`);
    const result =
      await attendanceNotificationService.checkAndSendAbsentWithoutLeaveNotices();
    return result;
  },
);

attendanceNotificationQueue.on("completed", (job, result) => {
  console.log(
    `[Worker] Attendance notification job ${job.id} completed:`,
    result,
  );
});

attendanceNotificationQueue.on("failed", (job, err) => {
  console.error(
    `[Worker] Attendance notification job ${job.id} failed:`,
    err.message,
  );
});

attendanceNotificationQueue.on("error", (err) => {
  console.error("[Worker] Attendance notification queue error:", err);
});

// Schedule daily checks (run at 6 PM every day)
attendanceNotificationQueue.add(
  "check-late-notices",
  { threshold: 3 },
  {
    repeat: { cron: "0 18 * * *" }, // Every day at 6 PM
  },
);

attendanceNotificationQueue.add(
  "check-absent-without-leave",
  {},
  {
    repeat: { cron: "0 18 * * *" }, // Every day at 6 PM
  },
);

console.log("[Worker] Scheduled daily attendance notification checks at 6 PM");

// Connect to database
pool
  .connect()
  .then(() => console.log("[Worker] PostgreSQL Connected"))
  .catch((err) => console.error("[Worker] DB Error:", err));

console.log("[Worker] Worker started. Waiting for jobs...");
console.log("[Worker] Queue: payslip-emails");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing worker...");
  await payslipQueue.close();
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing worker...");
  await payslipQueue.close();
  await pool.end();
  process.exit(0);
});
