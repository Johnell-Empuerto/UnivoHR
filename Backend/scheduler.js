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

// Track if job is already running to prevent duplicate execution
let isProcessing = false;

/**
 * Execute year-end leave conversion
 */
const executeYearEndConversion = async () => {
  if (isProcessing) {
    console.log('[Scheduler] Year-end conversion already in progress, skipping...');
    return;
  }

  try {
    isProcessing = true;
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    console.log('========================================');
    console.log('[Scheduler] Starting year-end leave conversion');
    console.log(`[Scheduler] Processing year: ${previousYear}`);
    console.log(`[Scheduler] Timestamp: ${new Date().toISOString()}`);
    console.log('========================================');

    // Execute the year-end conversion
    const result = await leaveConversionService.processYearEndLeaveConversion(
      previousYear,
      null // processed_by = null (system-triggered)
    );

    console.log('========================================');
    console.log('[Scheduler] Year-end conversion completed');
    console.log('========================================');
    console.log(JSON.stringify(result, null, 2));

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
        console.log('[Scheduler] Conversion logged to database');
      } catch (logErr) {
        console.error('[Scheduler] Failed to log to database:', logErr.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Year-end conversion failed:', err.message);

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
      console.error('[Scheduler] Failed to log failure:', logErr.message);
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
    console.log('[Scheduler] Triggering year-end leave conversion...');
    executeYearEndConversion();
  }, {
    scheduled: true,
    timezone: 'Asia/Manila', // Philippines timezone
  });

  console.log('[Scheduler] Year-end conversion job scheduled for Dec 31 at 23:59');

  // Optional: Monthly health check on the 1st of every month at 8:00 AM
  const healthCheckJob = cron.schedule('0 8 1 * *', async () => {
    console.log('[Scheduler] Running monthly health check...');
    try {
      const stats = await leaveConversionService.getConversionStatistics();
      console.log('[Scheduler] Health check passed:', stats);
    } catch (err) {
      console.error('[Scheduler] Health check failed:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Manila',
  });

  console.log('[Scheduler] Monthly health check scheduled for 1st of each month at 8:00 AM');

  return { yearEndJob, healthCheckJob };
};

/**
 * Start the scheduler
 */
const startScheduler = () => {
  console.log('[Scheduler] Starting Leave Conversion Scheduler...');
  const jobs = scheduleJobs();
  console.log('[Scheduler] Scheduler started successfully');
  return jobs;
};

/**
 * Stop the scheduler
 */
const stopScheduler = () => {
  console.log('[Scheduler] Stopping scheduler...');
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
  console.log('[Scheduler] Running as standalone process');

  // Connect to database
  pool.connect()
    .then(() => {
      console.log('[Scheduler] PostgreSQL connected');
      startScheduler();
    })
    .catch((err) => {
      console.error('[Scheduler] Database connection failed:', err.message);
      process.exit(1);
    });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Scheduler] SIGTERM received, shutting down...');
    stopScheduler();
    pool.end();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('[Scheduler] SIGINT received, shutting down...');
    stopScheduler();
    pool.end();
    process.exit(0);
  });
}
