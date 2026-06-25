const app = require("./app");
const pool = require("./config/db");
const port = 3002;
const http = require("http");
const server = http.createServer(app);
server.timeout = Number(process.env.SERVER_TIMEOUT) || 120000;

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
  console.error("[DeviceWorker] Failed to start worker:", err.message);
});

// Graceful shutdown - clean up queues
const shutdown = async (signal) => {
  console.log(`${signal} received, closing queues...`);
  await Promise.allSettled([
    queueService.payslipQueue.close(),
    queueService.hrFormQueue.close(),
    deviceProcessingQueue.deviceProcessingQueue.close(),
  ]);
  console.log("All queues closed. Exiting.");
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// =====================
// DB CONNECTION
// =====================
pool
  .connect()
  .then(async () => {
    console.log("PostgreSQL Connected");
    try {
      await require("./models/hrForm.model").init();
      console.log("HR Forms tables initialized");
    } catch (err) {
      console.error("HR Forms init error:", err.message);
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
          console.log("Admin permissions seeded successfully");
        }
      }
    } catch (err) {
      console.error("Admin permissions seed error:", err.message);
    }
  })
  .catch((err) => console.error("DB Error:", err));

// =====================
// START SERVER
// =====================
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
