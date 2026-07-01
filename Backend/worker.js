// worker.js - Separate process for background jobs
const Queue = require("bull");
const smtpService = require("./services/smtp.service");
const settingService = require("./services/setting.service");
const emailTemplateService = require("./services/emailTemplate.service");
const attendanceNotificationService = require("./services/attendanceNotification.service");
const notificationDispatch = require("./services/notificationDispatch.service");
const pool = require("./config/db");
require("dotenv").config();
const logger = require("./utils/logger");

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

// Idempotent repeatable job registration — removes existing duplicates before adding
const ensureRepeatableJob = async (queue, name, data, options) => {
  const jobs = await queue.getRepeatableJobs();
  const cron = options?.repeat?.cron;
  for (const job of jobs) {
    if (job.name === name && job.cron === cron) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
  await queue.add(name, data, options);
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

  logger.info(
    `[Worker] Processing payslip for ${employee.email} (Attempt ${job.attemptsMade + 1})`,
  );

  try {
    const isEnabled = await notificationDispatch.canSendEmail("payroll_marked_paid");

    if (!isEnabled) {
      logger.info(`[Worker] payroll_marked_paid email disabled via notification_rules, skipping payslip email`);
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

    logger.info(`[Worker] Payslip email sent to ${employee.email}`);

    // Log success to database
    await pool.query(
      `INSERT INTO email_logs (employee_id, payroll_id, type, status, sent_at)
       VALUES ($1, $2, $3, 'SENT', NOW())`,
      [employee.id, payroll.id, "PAYSLIP"],
    );

    return { success: true };
  } catch (error) {
    logger.error({ error }, `[Worker] Failed to send payslip to ${employee.email}`);

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
  logger.info(`[Worker] Job ${job.id} completed successfully`);
});

payslipQueue.on("failed", (job, err) => {
  logger.error({ err }, `[Worker] Job ${job.id} failed after ${job.attemptsMade} attempts`);
});

payslipQueue.on("error", (err) => {
  logger.error({ err }, "[Worker] Queue error");
});

// Process attendance notification checks
attendanceNotificationQueue.process("check-late-notices", async (job) => {
  const { threshold } = job.data;
  logger.info(`[Worker] Checking late notices (threshold: ${threshold})`);
  const result =
    await attendanceNotificationService.checkAndSendLateNotices(threshold);
  return result;
});

attendanceNotificationQueue.process(
  "check-absent-without-leave",
  async (job) => {
    logger.info(`[Worker] Checking absent without leave`);
    const result =
      await attendanceNotificationService.checkAndSendAbsentWithoutLeaveNotices();
    return result;
  },
);

attendanceNotificationQueue.on("completed", (job, result) => {
  logger.info({ result }, `[Worker] Attendance notification job ${job.id} completed`);
});

attendanceNotificationQueue.on("failed", (job, err) => {
  logger.error({ err }, `[Worker] Attendance notification job ${job.id} failed`);
});

attendanceNotificationQueue.on("error", (err) => {
  logger.error({ err }, "[Worker] Attendance notification queue error");
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
  logger.info("[Worker] Processing daily anomaly scan...");
  const results = await anomalyService.runDailyAnomalyScan();
  logger.info(`[Worker] Daily anomaly scan complete: ${results.total_detected} anomalies`);
  return results;
});

anomalyQueue.process("weekly-scan", async (job) => {
  logger.info("[Worker] Processing weekly anomaly scan...");
  const results = await anomalyService.runWeeklyAnomalyScan();
  logger.info(`[Worker] Weekly anomaly scan complete: ${results.total_detected} anomalies`);
  return results;
});

anomalyQueue.on("completed", (job, result) => {
  logger.info({ result }, `[Worker] Anomaly scan job ${job.id} completed`);
});

anomalyQueue.on("failed", (job, err) => {
  logger.error({ err }, `[Worker] Anomaly scan job ${job.id} failed`);
});

// Schedule daily anomaly scan at 2:00 AM
ensureRepeatableJob(anomalyQueue, "daily-scan", {}, { repeat: { cron: "0 2 * * *" } })
  .catch(err => logger.error({ err }, "[Worker] Failed to register daily-scan"));

// Schedule weekly anomaly scan on Monday at 3:00 AM
ensureRepeatableJob(anomalyQueue, "weekly-scan", {}, { repeat: { cron: "0 3 * * 1" } })
  .catch(err => logger.error({ err }, "[Worker] Failed to register weekly-scan"));

logger.info("[Worker] Scheduled daily anomaly scan at 2:00 AM");
logger.info("[Worker] Scheduled weekly anomaly scan on Monday at 3:00 AM");

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
  logger.info("[Worker] Processing daily statistical anomaly scan...");
  const results = await statAnomalyService.runDailyStatisticalScan();
  logger.info(`[Worker] Daily stat scan complete: ${results.total_detected} anomalies`);
  return results;
});

statAnomalyQueue.process("weekly-stat-scan", async (job) => {
  logger.info("[Worker] Processing weekly statistical anomaly scan...");
  const results = await statAnomalyService.runWeeklyStatisticalScan();
  logger.info(`[Worker] Weekly stat scan complete: ${results.total_detected} anomalies`);
  return results;
});

statAnomalyQueue.on("completed", (job, result) => {
  logger.info({ result }, `[Worker] Stat anomaly job ${job.id} completed`);
});

statAnomalyQueue.on("failed", (job, err) => {
  logger.error({ err }, `[Worker] Stat anomaly job ${job.id} failed`);
});

// Schedule daily statistical scan at 2:30 AM
ensureRepeatableJob(statAnomalyQueue, "daily-stat-scan", {}, { repeat: { cron: "30 2 * * *" } })
  .catch(err => logger.error({ err }, "[Worker] Failed to register daily-stat-scan"));

// Schedule weekly statistical scan on Monday at 3:30 AM
ensureRepeatableJob(statAnomalyQueue, "weekly-stat-scan", {}, { repeat: { cron: "30 3 * * 1" } })
  .catch(err => logger.error({ err }, "[Worker] Failed to register weekly-stat-scan"));

logger.info("[Worker] Scheduled daily statistical anomaly scan at 2:30 AM");
logger.info("[Worker] Scheduled weekly statistical anomaly scan on Monday at 3:30 AM");

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
  logger.info(`[Worker] Processing bulk assignment for form ${formId} to ${employeeIds.length} employees`);
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
    }).catch(err => logger.error({ err }, "[Worker] Failed to send assignment notifications"));
  }

  logger.info(`[Worker] Bulk assignment complete: ${result.created_count} created, ${result.skipped_employee_ids.length} skipped`);
  return result;
});

hrFormQueue.on("completed", (job, result) => {
  logger.info({ result }, `[Worker] HR Form assignment job ${job.id} completed`);
});

hrFormQueue.on("failed", (job, err) => {
  logger.error({ err }, `[Worker] HR Form assignment job ${job.id} failed`);
});

hrFormQueue.on("error", (err) => {
  logger.error({ err }, "[Worker] HR Form assignment queue error");
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
  logger.info("[Worker] Generating all forecasts...");
  const results = await forecastService.runAllForecasts();
  logger.info(`[Worker] Forecast generation complete`);
  return results;
});

forecastQueue.process("generate-branch-forecasts", async (job) => {
  logger.info("[Worker] Generating branch-level forecasts...");
  const results = await forecastService.forecastByBranch();
  logger.info(`[Worker] Branch forecast generation complete`);
  return results;
});

forecastQueue.on("completed", (job, result) => {
  logger.info(`[Worker] Forecast job ${job.id} completed`);
});

forecastQueue.on("failed", (job, err) => {
  logger.error({ err }, `[Worker] Forecast job ${job.id} failed`);
});

// Schedule daily forecast at 4:00 AM
ensureRepeatableJob(forecastQueue, "generate-forecasts", {}, { repeat: { cron: "0 4 * * *" } })
  .catch(err => logger.error({ err }, "[Worker] Failed to register generate-forecasts"));

// Schedule weekly branch forecasts on Monday at 4:30 AM
ensureRepeatableJob(forecastQueue, "generate-branch-forecasts", {}, { repeat: { cron: "30 4 * * 1" } })
  .catch(err => logger.error({ err }, "[Worker] Failed to register generate-branch-forecasts"));

logger.info("[Worker] Scheduled daily forecast generation at 4:00 AM");
logger.info("[Worker] Scheduled weekly branch forecast generation on Monday at 4:30 AM");

// Schedule daily checks (run at 6 PM every day)
ensureRepeatableJob(attendanceNotificationQueue, "check-late-notices", { threshold: 3 }, { repeat: { cron: "0 18 * * *" } })
  .catch(err => logger.error({ err }, "[Worker] Failed to register check-late-notices"));

ensureRepeatableJob(attendanceNotificationQueue, "check-absent-without-leave", {}, { repeat: { cron: "0 18 * * *" } })
  .catch(err => logger.error({ err }, "[Worker] Failed to register check-absent-without-leave"));

logger.info("[Worker] Scheduled daily attendance notification checks at 6 PM");

// Connect to database
pool
  .connect()
  .then(() => logger.info("[Worker] PostgreSQL Connected"))
  .catch((err) => logger.error({ err }, "[Worker] DB Error"));

logger.info("[Worker] Worker started. Waiting for jobs...");
logger.info("[Worker] Queue: payslip-emails");

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing worker...");
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
  logger.info("SIGINT received, closing worker...");
  await payslipQueue.close();
  await attendanceNotificationQueue.close();
  await anomalyQueue.close();
  await statAnomalyQueue.close();
  await forecastQueue.close();
  await hrFormQueue.close();
  await pool.end();
  process.exit(0);
});
