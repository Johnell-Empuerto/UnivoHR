const deviceProcessingQueue = require("../services/deviceProcessing.queue");
const deviceProcessingService = require("../services/deviceProcessing.service");
const logger = require("../utils/logger");

const startWorker = async () => {
  if (process.env.WORKER_ENABLED === "false") {
    logger.info("[DeviceWorker] Disabled via WORKER_ENABLED=false");
    return;
  }

  const redisReady = await deviceProcessingQueue.isReady();
  if (!redisReady) {
    logger.warn("[DeviceWorker] Redis is not available. Queue processor will not run. Integration service will use direct fallback for new logs.");
  } else {
    logger.info("[DeviceWorker] Redis is available, registering queue processor");
  }

  deviceProcessingQueue.deviceProcessingQueue.process("process-log", async (job) => {
    const { rawLogId } = job.data;
    await deviceProcessingService.processSingleLog(rawLogId);
  });

  deviceProcessingQueue.deviceProcessingQueue.on("completed", (job) => {
    logger.info({ jobId: job.id, rawLogId: job.data.rawLogId }, `[DeviceWorker] Job ${job.id} (raw_log ${job.data.rawLogId}) completed`);
  });

  deviceProcessingQueue.deviceProcessingQueue.on("failed", (job, err) => {
    logger.error({ err, jobId: job.id, rawLogId: job.data.rawLogId, attempts: job.attemptsMade }, `[DeviceWorker] Job ${job.id} (raw_log ${job.data.rawLogId}) failed after ${job.attemptsMade} attempts:`);
  });

  deviceProcessingQueue.deviceProcessingQueue.on("error", (err) => {
    logger.error({ err }, "[DeviceWorker] Queue error:");
  });

  // Drain existing PENDING/FAILED logs on startup
  deviceProcessingService.drainQueue().then((count) => {
    if (count > 0) {
      logger.info({ count }, `[DeviceWorker] Drained ${count} pending/failed logs from raw_logs`);
    }
  }).catch((err) => {
    logger.error({ err }, "[DeviceWorker] Error draining raw_logs:");
  });

  logger.info("[DeviceWorker] Device processing worker started");
};

module.exports = { startWorker };
