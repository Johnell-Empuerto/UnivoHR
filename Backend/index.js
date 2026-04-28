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

// Middleware
const authenticate = require("./middleware/auth.middleware");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

// =====================
// CORS
// =====================
app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.0.111:5173"],
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

app.use("/api/overtime", overtimeRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/users", userRoutes);

app.use("/api/smtp", smtpRoutes);

app.use("/api/final-pay", authenticate, finalPayRoutes);

// Public (if needed)
app.use("/api/device", deviceRoutes);

app.use("/api/settings", settingRoutes);

app.use("/api/email-templates", emailTemplateRoutes);

app.use("/api/man-hour-reports", manHourReportRoutes);

app.use("/api/profile", profileRoutes);

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
  .then(() => console.log("PostgreSQL Connected"))
  .catch((err) => console.error("DB Error:", err));

// =====================
// START SERVER
// =====================
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
