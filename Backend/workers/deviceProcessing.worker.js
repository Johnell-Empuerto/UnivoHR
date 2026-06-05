const deviceProcessingQueue = require("../services/deviceProcessing.queue");
const deviceProcessingService = require("../services/deviceProcessing.service");

const startWorker = async () => {
  if (process.env.WORKER_ENABLED === "false") {
    console.log("[DeviceWorker] Disabled via WORKER_ENABLED=false");
    return;
  }

  const redisReady = await deviceProcessingQueue.isReady();
  if (!redisReady) {
    console.warn("[DeviceWorker] Redis is not available. Queue processor will not run. Integration service will use direct fallback for new logs.");
  } else {
    console.log("[DeviceWorker] Redis is available, registering queue processor");
  }

  deviceProcessingQueue.deviceProcessingQueue.process("process-log", async (job) => {
    const { rawLogId } = job.data;
    await deviceProcessingService.processSingleLog(rawLogId);
  });

  deviceProcessingQueue.deviceProcessingQueue.on("completed", (job) => {
    console.log(`[DeviceWorker] Job ${job.id} (raw_log ${job.data.rawLogId}) completed`);
  });

  deviceProcessingQueue.deviceProcessingQueue.on("failed", (job, err) => {
    console.error(
      `[DeviceWorker] Job ${job.id} (raw_log ${job.data.rawLogId}) failed after ${job.attemptsMade} attempts:`,
      err.message
    );
  });

  deviceProcessingQueue.deviceProcessingQueue.on("error", (err) => {
    console.error("[DeviceWorker] Queue error:", err.message);
  });

  // Drain existing PENDING/FAILED logs on startup
  deviceProcessingService.drainQueue().then((count) => {
    if (count > 0) {
      console.log(`[DeviceWorker] Drained ${count} pending/failed logs from raw_logs`);
    }
  }).catch((err) => {
    console.error("[DeviceWorker] Error draining raw_logs:", err.message);
  });

  console.log("[DeviceWorker] Device processing worker started");
};

module.exports = { startWorker };
