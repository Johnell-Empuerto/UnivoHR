/**
 * LEAVE CONVERSION SCHEDULER
 *
 * Automated cron job for year-end leave conversion processing.
 * Runs automatically on December 31 at 23:59.
 *
 * Uses node-cron package for scheduling.
 */

const cron = require('node-cron');
const leaveConversionService = require('./services/leaveConversion.service');
const pool = require('./config/db');
const logger = require('./utils/logger');

// Track if job is already running to prevent duplicate execution
let isProcessing = false;

/**
 * Execute year-end leave conversion
 */
const executeYearEndConversion = async () => {
  if (isProcessing) {
    logger.info('[Scheduler] Year-end conversion already in progress, skipping...');
    return;
  }

  try {
    isProcessing = true;
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    logger.info('========================================');
    logger.info('[Scheduler] Starting year-end leave conversion');
    logger.info(`[Scheduler] Processing year: ${previousYear}`);
    logger.info(`[Scheduler] Timestamp: ${new Date().toISOString()}`);
    logger.info('========================================');

    // Execute the year-end conversion
    const result = await leaveConversionService.processYearEndLeaveConversion(
      previousYear,
      null // processed_by = null (system-triggered)
    );

    logger.info('========================================');
    logger.info('[Scheduler] Year-end conversion completed');
    logger.info('========================================');
    logger.info(JSON.stringify(result, null, 2));

    // Log to database for audit trail
    if (result.success) {
      try {
        await pool.query(
          `INSERT INTO conversion_logs (
            year,
            processed_at,
            total_processed,
            total_converted,
            total_amount,
            status,
            details
          ) VALUES ($1, NOW(), $2, $3, $4, $5, $6)`,
          [
            previousYear,
            result.results?.total_processed || 0,
            result.results?.total_converted || 0,
            result.results?.total_amount || 0,
            'SUCCESS',
            JSON.stringify(result.results),
          ]
        );
        logger.info('[Scheduler] Conversion logged to database');
      } catch (logErr) {
        logger.error({ err: logErr }, '[Scheduler] Failed to log to database');
      }
    }
  } catch (err) {
    logger.error({ err }, '[Scheduler] Year-end conversion failed');

    // Log failure to database
    try {
      await pool.query(
        `INSERT INTO conversion_logs (
          year,
          processed_at,
          total_processed,
          total_converted,
          total_amount,
          status,
          details
        ) VALUES ($1, NOW(), $2, $3, $4, $5, $6)`,
        [
          new Date().getFullYear() - 1,
          0,
          0,
          0,
          'FAILED',
          JSON.stringify({ error: err.message }),
        ]
      );
    } catch (logErr) {
      logger.error({ err: logErr }, '[Scheduler] Failed to log failure');
    }
  } finally {
    isProcessing = false;
  }
};

/**
 * Schedule the cron jobs
 */
const scheduleJobs = () => {
  // Year-end conversion: December 31 at 23:59
  // Cron format: minute hour day-of-month month day-of-week
  const yearEndJob = cron.schedule('59 23 31 12 *', () => {
    logger.info('[Scheduler] Triggering year-end leave conversion...');
    executeYearEndConversion();
  }, {
    scheduled: true,
    timezone: 'Asia/Manila', // Philippines timezone
  });

  logger.info('[Scheduler] Year-end conversion job scheduled for Dec 31 at 23:59');

  // Optional: Monthly health check on the 1st of every month at 8:00 AM
  const healthCheckJob = cron.schedule('0 8 1 * *', async () => {
    logger.info('[Scheduler] Running monthly health check...');
    try {
      const stats = await leaveConversionService.getConversionStatistics();
      logger.info({ stats }, '[Scheduler] Health check passed');
    } catch (err) {
      logger.error({ err }, '[Scheduler] Health check failed');
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Manila',
  });

  logger.info('[Scheduler] Monthly health check scheduled for 1st of each month at 8:00 AM');

  return { yearEndJob, healthCheckJob };
};

/**
 * Start the scheduler
 */
const startScheduler = () => {
  logger.info('[Scheduler] Starting Leave Conversion Scheduler...');
  const jobs = scheduleJobs();
  logger.info('[Scheduler] Scheduler started successfully');
  return jobs;
};

/**
 * Stop the scheduler
 */
const stopScheduler = () => {
  logger.info('[Scheduler] Stopping scheduler...');
  // Jobs will be stopped by process termination
};

// Export for use in other modules
module.exports = {
  startScheduler,
  stopScheduler,
  executeYearEndConversion,
  scheduleJobs,
};

// If run directly (not imported), start the scheduler
if (require.main === module) {
  logger.info('[Scheduler] Running as standalone process');

  // Connect to database
  pool.connect()
    .then(() => {
      logger.info('[Scheduler] PostgreSQL connected');
      startScheduler();
    })
    .catch((err) => {
      logger.error({ err }, '[Scheduler] Database connection failed');
      process.exit(1);
    });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('[Scheduler] SIGTERM received, shutting down...');
    stopScheduler();
    pool.end();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('[Scheduler] SIGINT received, shutting down...');
    stopScheduler();
    pool.end();
    process.exit(0);
  });
}
