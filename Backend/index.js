const express = require("express");
const app = express();
const pool = require("./config/db");
const port = 3002;
const http = require("http");
const server = http.createServer(app);
const cors = require("cors");
const helmet = require("helmet");

const { initSocket } = require("./config/socket");

initSocket(server);

// =====================
// GLOBAL SECURITY HEADERS
// =====================
app.use(helmet());

// =====================
// CORS
// =====================
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://192.168.0.110:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// =====================
// BODY PARSER
// =====================
app.use(express.json());

// =====================
// HEALTH CHECK (public)
// =====================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes
const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employee.routes");
const leaveRoutes = require("./routes/leave.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const deviceRoutes = require("./routes/device.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const payrollRoutes = require("./routes/payroll.routes");
const attendanceRulesRoutes = require("./routes/attendanceRules.routes");
const calendarRoutes = require("./routes/calendar.routes");
const payRulesRoutes = require("./routes/payRules.routes");
const leaveConversionRoutes = require("./routes/leaveConversion.routes");
const historyLeaveRoutes = require("./routes/historyLeave.routes");
const overtimeRoutes = require("./routes/overtime.routes");
const notificationRoutes = require("./routes/notification.routes");
const notificationRuleRoutes = require("./routes/notificationRule.routes");
const userRoutes = require("./routes/user.routes");
const smtpRoutes = require("./routes/smtp.routes");
const shiftRoutes = require("./routes/shift.routes");
const settingRoutes = require("./routes/setting.routes");
const emailTemplateRoutes = require("./routes/emailTemplate.routes");
const manHourReportRoutes = require("./routes/man_hour_report.routes");
const finalPayRoutes = require("./routes/finalPay.routes");
const profileRoutes = require("./routes/profile.routes");
const branchRoutes = require("./routes/branch.routes");
const anomalyRoutes = require("./routes/anomaly.routes");
const drilldownRoutes = require("./routes/drilldown.routes");
const forecastRoutes = require("./routes/forecast.routes");
const statisticalAnomalyRoutes = require("./routes/statisticalAnomaly.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const hrPolicyRoutes = require("./routes/hrPolicy.routes");
const jobPositionRoutes = require("./routes/jobPosition.routes");
const applicantRoutes = require("./routes/applicant.routes");
const applicantRequirementRoutes = require("./routes/applicantRequirement.routes");
const applicantInterviewRoutes = require("./routes/applicantInterview.routes");
const applicantApprovalRoutes = require("./routes/applicantApproval.routes");
const applicantBiodataRoutes = require("./routes/applicantBiodata.routes");
const kpiTemplateRoutes = require("./routes/kpiTemplate.routes");
const kpiEvaluationRoutes = require("./routes/kpiEvaluation.routes");
const hrFormRoutes = require("./routes/hrForm.routes");
const reportRoutes = require("./routes/report.routes");
const permissionRoutes = require("./routes/permission.routes");
const employeeFamilyRoutes = require("./routes/employeeFamily.routes");
const employeeEducationRoutes = require("./routes/employeeEducation.routes");
const employeeWorkExperienceRoutes = require("./routes/employeeWorkExperience.routes");
const employeeRestDayRoutes = require("./routes/employeeRestDay.routes");
const branchRestDayRoutes = require("./routes/branchRestDay.routes");
const rotationRoutes = require("./routes/rotation.routes");
const recruitmentWorkflowRoutes = require("./routes/recruitmentWorkflow.routes");
const deviceIntegrationRoutes = require("./routes/deviceIntegration.routes");

// Middleware
const authenticate = require("./middleware/auth.middleware");
const logger = require("./middleware/logger");
const {
  readOnlyLimiter,
  writeLimiter,
} = require("./middleware/rateLimit.middleware");
const errorHandler = require("./middleware/errorHandler");

// =====================
// GLOBAL MIDDLEWARE
// =====================
app.use(logger);

// =====================
// PUBLIC ROUTES
// =====================
app.use("/api/auth", authRoutes);

// =====================
// METHOD-BASED API RATE LIMITER (applied after public routes, before protected routes)
// GET requests (dashboard, sidebar fetches, etc.) get a higher limit.
// POST/PUT/PATCH/DELETE get a stricter limit.
// Auth routes are NOT affected — they have their own route-level limiters applied earlier.
// =====================
app.use("/api", (req, res, next) => {
  if (req.method === "GET") return readOnlyLimiter(req, res, next);
  return writeLimiter(req, res, next);
});

// =====================
// PROTECTED ROUTES (AUTH ONLY)
// =====================

// IMPORTANT: NO authorize already added in routes

app.use("/api/employees", authenticate, employeeRoutes);

app.use("/api/pay-rules", authenticate, payRulesRoutes);

app.use("/api/payroll", authenticate, payrollRoutes);

app.use("/api/attendance", authenticate, attendanceRoutes);

app.use("/api/attendance-rules", authenticate, attendanceRulesRoutes);

app.use("/api/leaves", authenticate, leaveRoutes);

app.use("/api/dashboard", authenticate, dashboardRoutes);

app.use("/api/calendar", authenticate, calendarRoutes);

app.use("/api/leave-conversion", authenticate, leaveConversionRoutes);

app.use("/api/history-leave", authenticate, historyLeaveRoutes);

app.use("/api/overtime", authenticate, overtimeRoutes);

app.use("/api/notifications", authenticate, notificationRoutes);
app.use("/api/notification-rules", authenticate, notificationRuleRoutes);

app.use("/api/users", authenticate, userRoutes);

app.use("/api/shifts", authenticate, shiftRoutes);

app.use("/api/rotation", authenticate, rotationRoutes);

app.use("/api/device-integration", authenticate, deviceIntegrationRoutes);

app.use("/api/smtp", authenticate, smtpRoutes);

app.use("/api/final-pay", authenticate, finalPayRoutes);

// Device API uses API key auth (middleware in route file)
app.use("/api/device", deviceRoutes);

app.use("/api/settings", authenticate, settingRoutes);

app.use("/api/email-templates", authenticate, emailTemplateRoutes);

app.use("/api/man-hour-reports", authenticate, manHourReportRoutes);

app.use("/api/profile", authenticate, profileRoutes);

app.use("/api/branches", authenticate, branchRoutes);

app.use("/api/anomalies", authenticate, anomalyRoutes);
app.use("/api/drilldown", authenticate, drilldownRoutes);
app.use("/api/forecast", authenticate, forecastRoutes);
app.use("/api/stats-anomaly", authenticate, statisticalAnomalyRoutes);
app.use("/api/analytics", authenticate, analyticsRoutes);
app.use("/api/hr-policies", authenticate, hrPolicyRoutes);

app.use("/api/job-positions", authenticate, jobPositionRoutes);
app.use("/api/applicants", authenticate, applicantRoutes);

app.use("/api/applicant-interviews", authenticate, applicantInterviewRoutes);

app.use("/api/applicant-approvals", authenticate, applicantApprovalRoutes);

app.use("/api/recruitment-workflows", authenticate, recruitmentWorkflowRoutes);

app.use("/api/kpi/templates", authenticate, kpiTemplateRoutes);
app.use("/api/kpi/evaluations", authenticate, kpiEvaluationRoutes);
app.use("/api/hr-forms", authenticate, hrFormRoutes);
app.use(
  "/api/employee/performance",
  authenticate,
  require("./routes/employeePerformance.routes"),
);
app.use("/api/applicants", authenticate, applicantRequirementRoutes);

app.use("/api/reports", authenticate, reportRoutes);

app.use("/api/permissions", authenticate, permissionRoutes);

app.use(
  "/api/employees/:employeeId/family",
  authenticate,
  employeeFamilyRoutes,
);
app.use(
  "/api/employees/:employeeId/education",
  authenticate,
  employeeEducationRoutes,
);
app.use(
  "/api/employees/:employeeId/experience",
  authenticate,
  employeeWorkExperienceRoutes,
);

app.use("/api/applicants/:applicantId", authenticate, applicantBiodataRoutes);

app.use(
  "/api/employees/:employeeId/rest-days",
  authenticate,
  employeeRestDayRoutes,
);
app.use("/api/branch-rest-days", authenticate, branchRestDayRoutes);

const payrollRuleRoutes = require("./routes/payrollRule.routes");
app.use("/api/payroll-rules", authenticate, payrollRuleRoutes);

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

// =====================
// ROOT TEST
// =====================
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Payroll and Attendance System",
    version: "1.0.0",
  });
});

// =====================
// 404 HANDLER
// =====================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// =====================
// ERROR HANDLER
// =====================
app.use(errorHandler);

// Graceful shutdown - clean up queues
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing queues...");
  await queueService.payslipQueue.close();
  await deviceProcessingQueue.deviceProcessingQueue.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing queues...");
  await queueService.payslipQueue.close();
  await deviceProcessingQueue.deviceProcessingQueue.close();
  process.exit(0);
});

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
