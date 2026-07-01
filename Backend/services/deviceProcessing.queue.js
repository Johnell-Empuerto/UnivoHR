const Queue = require("bull");
const logger = require("../utils/logger");

const deviceProcessingQueue = new Queue("device-processing", {
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

const addLogToQueue = async (rawLogId) => {
  const job = await deviceProcessingQueue.add("process-log", { rawLogId });
  return job;
};

const addBatchToQueue = async (rawLogIds) => {
  const jobs = [];
  for (const id of rawLogIds) {
    const job = await deviceProcessingQueue.add(
      "process-log",
      { rawLogId: id },
      { delay: jobs.length * 100 },
    );
    jobs.push(job);
  }
  return jobs;
};

const getQueueStats = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    deviceProcessingQueue.getWaitingCount(),
    deviceProcessingQueue.getActiveCount(),
    deviceProcessingQueue.getCompletedCount(),
    deviceProcessingQueue.getFailedCount(),
    deviceProcessingQueue.getDelayedCount(),
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

const isReady = async () => {
  try {
    await deviceProcessingQueue.isReady();
    await deviceProcessingQueue.client.ping();
    return true;
  } catch {
    return false;
  }
};

const safeAddLog = async (rawLogId, fallbackFn) => {
  try {
    await deviceProcessingQueue.add("process-log", { rawLogId });
  } catch (err) {
    logger.warn({ err }, `[Queue] Redis unavailable, using fallback for raw_log ${rawLogId}`);
    if (typeof fallbackFn === "function") {
      await fallbackFn(rawLogId);
    }
  }
};

const safeAddBatch = async (rawLogIds, fallbackFn) => {
  const fallbackIds = [];
  for (const id of rawLogIds) {
    try {
      await deviceProcessingQueue.add(
        "process-log",
        { rawLogId: id },
        { delay: fallbackIds.length * 100 },
      );
    } catch (err) {
      logger.warn({ err }, `[Queue] Redis unavailable, using fallback for raw_log ${id}`);
      fallbackIds.push(id);
    }
  }
  if (fallbackIds.length > 0 && typeof fallbackFn === "function") {
    for (const id of fallbackIds) {
      await fallbackFn(id);
    }
  }
};

module.exports = { deviceProcessingQueue, addLogToQueue, addBatchToQueue, getQueueStats, isReady, safeAddLog, safeAddBatch };
