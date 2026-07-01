const app = require("./app");
const pool = require("./config/db");
const port = 3002;
const http = require("http");
const server = http.createServer(app);
server.timeout = Number(process.env.SERVER_TIMEOUT) || 120000;

const logger = require("./utils/logger");
const { initSocket } = require("./config/socket");

initSocket(server);

const queueService = require("./services/queue.service");
const deviceProcessingQueue = require("./services/deviceProcessing.queue");

// Start the leave conversion scheduler
const scheduler = require("./scheduler");
scheduler.startScheduler();

// Start the device processing worker
const startDeviceProcessingWorker =
  require("./workers/deviceProcessing.worker").startWorker;
startDeviceProcessingWorker().catch((err) => {
  logger.error({ err }, "[DeviceWorker] Failed to start worker");
});

// Graceful shutdown - clean up queues
const shutdown = async (signal) => {
  logger.info(`${signal} received, closing queues...`);
  await Promise.allSettled([
    queueService.payslipQueue.close(),
    queueService.hrFormQueue.close(),
    deviceProcessingQueue.deviceProcessingQueue.close(),
  ]);
  logger.info("All queues closed. Exiting.");
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "UNHANDLED REJECTION");
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "UNCAUGHT EXCEPTION");
  process.exit(1);
});

// =====================
// DB CONNECTION
// =====================
pool
  .connect()
  .then(async () => {
    logger.info("PostgreSQL Connected");
    try {
      await require("./models/hrForm.model").init();
      logger.info("HR Forms tables initialized");
    } catch (err) {
      logger.error({ err }, "HR Forms init error");
    }
    try {
      const permissionModel = require("./models/permission.model");
      const adminResult = await pool.query(
        "SELECT id FROM users WHERE username = 'admin'",
      );
      if (adminResult.rows.length > 0) {
        const adminId = adminResult.rows[0].id;
        const existingPermissions =
          await permissionModel.getUserPermissions(adminId);
        if (existingPermissions.length === 0) {
          await permissionModel.seedAdminPermissions(adminId);
          logger.info("Admin permissions seeded successfully");
        }
      }
    } catch (err) {
      logger.error({ err }, "Admin permissions seed error");
    }
  })
  .catch((err) => logger.error({ err }, "DB Error"));

// =====================
// START SERVER
// =====================
server.listen(port, () => {
  logger.info(`Server running on http://localhost:${port}`);
});
