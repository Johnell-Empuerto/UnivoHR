// worker.js - Separate process for background jobs
const Queue = require("bull");
const smtpService = require("./services/smtp.service");
const settingService = require("./services/setting.service");
const emailTemplateService = require("./services/emailTemplate.service");
const attendanceNotificationService = require("./services/attendanceNotification.service");
const notificationDispatch = require("./services/notificationDispatch.service");
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
    const isEnabled = await notificationDispatch.canSendEmail("payroll_marked_paid");

    if (!isEnabled) {
      console.log(`[Worker] payroll_marked_paid email disabled via notification_rules, skipping payslip email`);
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

// ============================================
// ANOMALY DETECTION QUEUE
// ============================================
const anomalyQueue = new Queue("anomaly-scans", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const anomalyService = require("./services/anomaly.service");
const auditService = require("./services/audit.service");

anomalyQueue.process("daily-scan", async (job) => {
  console.log("[Worker] Processing daily anomaly scan...");
  const results = await anomalyService.runDailyAnomalyScan();
  console.log(`[Worker] Daily anomaly scan complete: ${results.total_detected} anomalies`);
  return results;
});

anomalyQueue.process("weekly-scan", async (job) => {
  console.log("[Worker] Processing weekly anomaly scan...");
  const results = await anomalyService.runWeeklyAnomalyScan();
  console.log(`[Worker] Weekly anomaly scan complete: ${results.total_detected} anomalies`);
  return results;
});

anomalyQueue.on("completed", (job, result) => {
  console.log(`[Worker] Anomaly scan job ${job.id} completed:`, result);
});

anomalyQueue.on("failed", (job, err) => {
  console.error(`[Worker] Anomaly scan job ${job.id} failed:`, err.message);
});

// Schedule daily anomaly scan at 2:00 AM
anomalyQueue.add(
  "daily-scan",
  {},
  {
    repeat: { cron: "0 2 * * *" },
  },
);

// Schedule weekly anomaly scan on Monday at 3:00 AM
anomalyQueue.add(
  "weekly-scan",
  {},
  {
    repeat: { cron: "0 3 * * 1" },
  },
);

console.log("[Worker] Scheduled daily anomaly scan at 2:00 AM");
console.log("[Worker] Scheduled weekly anomaly scan on Monday at 3:00 AM");

// ============================================
// STATISTICAL ANOMALY SCAN QUEUE
// ============================================
const statAnomalyQueue = new Queue("stat-anomaly-scans", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const statAnomalyService = require("./services/statisticalAnomaly.service");

statAnomalyQueue.process("daily-stat-scan", async (job) => {
  console.log("[Worker] Processing daily statistical anomaly scan...");
  const results = await statAnomalyService.runDailyStatisticalScan();
  console.log(`[Worker] Daily stat scan complete: ${results.total_detected} anomalies`);
  return results;
});

statAnomalyQueue.process("weekly-stat-scan", async (job) => {
  console.log("[Worker] Processing weekly statistical anomaly scan...");
  const results = await statAnomalyService.runWeeklyStatisticalScan();
  console.log(`[Worker] Weekly stat scan complete: ${results.total_detected} anomalies`);
  return results;
});

statAnomalyQueue.on("completed", (job, result) => {
  console.log(`[Worker] Stat anomaly job ${job.id} completed:`, result);
});

statAnomalyQueue.on("failed", (job, err) => {
  console.error(`[Worker] Stat anomaly job ${job.id} failed:`, err.message);
});

// Schedule daily statistical scan at 2:30 AM
statAnomalyQueue.add("daily-stat-scan", {}, {
  repeat: { cron: "30 2 * * *" },
});

// Schedule weekly statistical scan on Monday at 3:30 AM
statAnomalyQueue.add("weekly-stat-scan", {}, {
  repeat: { cron: "30 3 * * 1" },
});

console.log("[Worker] Scheduled daily statistical anomaly scan at 2:30 AM");
console.log("[Worker] Scheduled weekly statistical anomaly scan on Monday at 3:30 AM");

// ============================================
// HR FORM ASSIGNMENT QUEUE
// ============================================
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

const hrFormModel = require("./models/hrForm.model");
const notificationService = require("./services/notification.service");

hrFormQueue.process("bulk-assign", async (job) => {
  const { formId, employeeIds, userId, dueDate } = job.data;
  console.log(`[Worker] Processing bulk assignment for form ${formId} to ${employeeIds.length} employees`);
  const assignments = employeeIds.map(empId => ({
    form_id: formId,
    employee_id: empId,
    due_date: dueDate,
  }));
  const result = await hrFormModel.bulkCreateAssignments(assignments, userId);

  if (result.created_count > 0) {
    const form = await hrFormModel.getFormById(formId);
    hrFormModel.getUserIdsByEmployeeIds(result.created_employee_ids).then(userRows => {
      const promises = userRows
        .filter(row => row.id !== userId)
        .map(row => notificationService.notify({
          user_id: row.id,
          type: "HR_FORM",
          title: "New Form Assigned",
          message: `You have been assigned a new form: ${form?.title || "Untitled"}`,
          reference_id: formId,
          meta: { form_id: formId, form_title: form?.title },
        }));
      return Promise.all(promises);
    }).catch(err => console.error("[Worker] Failed to send assignment notifications:", err));
  }

  console.log(`[Worker] Bulk assignment complete: ${result.created_count} created, ${result.skipped_employee_ids.length} skipped`);
  return result;
});

hrFormQueue.on("completed", (job, result) => {
  console.log(`[Worker] HR Form assignment job ${job.id} completed:`, result);
});

hrFormQueue.on("failed", (job, err) => {
  console.error(`[Worker] HR Form assignment job ${job.id} failed:`, err.message);
});

hrFormQueue.on("error", (err) => {
  console.error("[Worker] HR Form assignment queue error:", err);
});

// ============================================
// FORECAST GENERATION QUEUE
// ============================================
const forecastQueue = new Queue("forecast-generation", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const forecastService = require("./services/forecast.service");

forecastQueue.process("generate-forecasts", async (job) => {
  console.log("[Worker] Generating all forecasts...");
  const results = await forecastService.runAllForecasts();
  console.log(`[Worker] Forecast generation complete`);
  return results;
});

forecastQueue.process("generate-branch-forecasts", async (job) => {
  console.log("[Worker] Generating branch-level forecasts...");
  const results = await forecastService.forecastByBranch();
  console.log(`[Worker] Branch forecast generation complete`);
  return results;
});

forecastQueue.on("completed", (job, result) => {
  console.log(`[Worker] Forecast job ${job.id} completed`);
});

forecastQueue.on("failed", (job, err) => {
  console.error(`[Worker] Forecast job ${job.id} failed:`, err.message);
});

// Schedule daily forecast at 4:00 AM
forecastQueue.add("generate-forecasts", {}, {
  repeat: { cron: "0 4 * * *" },
});

// Schedule weekly branch forecasts on Monday at 4:30 AM
forecastQueue.add("generate-branch-forecasts", {}, {
  repeat: { cron: "30 4 * * 1" },
});

console.log("[Worker] Scheduled daily forecast generation at 4:00 AM");
console.log("[Worker] Scheduled weekly branch forecast generation on Monday at 4:30 AM");

// Schedule daily checks (run at 6 PM every day)
attendanceNotificationQueue.add(
  "check-late-notices",
  { threshold: 3 },
  {
    repeat: { cron: "0 18 * * *" },
  },
);

attendanceNotificationQueue.add(
  "check-absent-without-leave",
  {},
  {
    repeat: { cron: "0 18 * * *" },
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
  await attendanceNotificationQueue.close();
  await anomalyQueue.close();
  await statAnomalyQueue.close();
  await forecastQueue.close();
  await hrFormQueue.close();
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing worker...");
  await payslipQueue.close();
  await attendanceNotificationQueue.close();
  await anomalyQueue.close();
  await statAnomalyQueue.close();
  await forecastQueue.close();
  await hrFormQueue.close();
  await pool.end();
  process.exit(0);
});
