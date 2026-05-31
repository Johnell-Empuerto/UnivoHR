const express = require("express");
const app = express();
const pool = require("./config/db");
const port = 3002;
const http = require("http");
const server = http.createServer(app);
const cors = require("cors");

const { initSocket } = require("./config/socket");

initSocket(server);

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
const userRoutes = require("./routes/user.routes");
const smtpRoutes = require("./routes/smtp.routes");
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
const kpiTemplateRoutes = require("./routes/kpiTemplate.routes");
const kpiEvaluationRoutes = require("./routes/kpiEvaluation.routes");
const hrFormRoutes = require("./routes/hrForm.routes");
const reportRoutes = require("./routes/report.routes");
const permissionRoutes = require("./routes/permission.routes");

// Middleware
const authenticate = require("./middleware/auth.middleware");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

// =====================
// CORS
// =====================
app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.0.105:5173"],
    credentials: true,
  }),
);

// =====================
// GLOBAL MIDDLEWARE
// =====================
app.use(express.json());
app.use(logger);

// =====================
// PUBLIC ROUTES
// =====================
app.use("/api/auth", authRoutes);

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

app.use("/api/users", authenticate, userRoutes);

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

const queueService = require("./services/queue.service");

// Start the leave conversion scheduler
const scheduler = require("./scheduler");
scheduler.startScheduler();

// =====================
// ROOT TEST
// =====================
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Payroll and Attendance System" });
});

// =====================
// ERROR HANDLER
// =====================
app.use(errorHandler);

// Graceful shutdown - clean up queue
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing queue...");
  await queueService.payslipQueue.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing queue...");
  await queueService.payslipQueue.close();
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
