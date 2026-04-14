// services/attendanceNotification.service.js
const pool = require("../config/db");
const smtpService = require("./smtp.service");
const settingService = require("./setting.service");
const emailTemplateService = require("./emailTemplate.service");

// Helper to format date
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Send late notice email to employee
const sendLateNoticeEmail = async (employeeId, lateCount, dates) => {
  try {
    const isEnabled = await settingService.getBoolSetting(
      "enable_late_email_notice",
    );

    if (!isEnabled) {
      console.log("Late email notice is disabled");
      return;
    }

    const employeeResult = await pool.query(
      `SELECT e.email, e.first_name, e.last_name
       FROM employees e
       WHERE e.id = $1`,
      [employeeId],
    );

    const employee = employeeResult.rows[0];
    if (!employee || !employee.email) {
      console.log(`No email found for employee ${employeeId}`);
      return;
    }

    const templateType = "LATE_NOTICE";
    const data = {
      employee_name: `${employee.first_name} ${employee.last_name}`,
      late_count: lateCount.toString(),
      dates: dates.map((d) => formatDate(d)).join(", "),
    };

    const { subject, html } = await emailTemplateService.renderEmail(
      templateType,
      data,
    );

    await smtpService.sendEmail(employee.email, subject, html);
    console.log(
      `Late notice email sent to ${employee.email} for ${lateCount} late occurrences`,
    );

    // Log success
    await pool.query(
      `INSERT INTO email_logs (employee_id, type, status, sent_at)
       VALUES ($1, $2, 'SENT', NOW())`,
      [employeeId, "LATE_NOTICE"],
    );
  } catch (error) {
    console.error("Failed to send late notice email:", error.message);

    // Log failure
    await pool.query(
      `INSERT INTO email_logs (employee_id, type, status, error, attempted_at)
       VALUES ($1, $2, 'FAILED', $3, NOW())`,
      [employeeId, "LATE_NOTICE", error.message],
    );
  }
};

// Send absent without leave email to employee
const sendAbsentWithoutLeaveEmail = async (employeeId, absentDate) => {
  try {
    const isEnabled = await settingService.getBoolSetting(
      "enable_absent_no_leave_email",
    );

    if (!isEnabled) {
      console.log("Absent without leave email is disabled");
      return;
    }

    const employeeResult = await pool.query(
      `SELECT e.email, e.first_name, e.last_name
       FROM employees e
       WHERE e.id = $1`,
      [employeeId],
    );

    const employee = employeeResult.rows[0];
    if (!employee || !employee.email) {
      console.log(`No email found for employee ${employeeId}`);
      return;
    }

    const templateType = "ABSENT_WITHOUT_LEAVE";
    const data = {
      employee_name: `${employee.first_name} ${employee.last_name}`,
      absent_date: formatDate(absentDate),
    };

    const { subject, html } = await emailTemplateService.renderEmail(
      templateType,
      data,
    );

    await smtpService.sendEmail(employee.email, subject, html);
    console.log(
      `Absent without leave email sent to ${employee.email} for ${formatDate(absentDate)}`,
    );

    // Log success
    await pool.query(
      `INSERT INTO email_logs (employee_id, type, status, sent_at)
       VALUES ($1, $2, 'SENT', NOW())`,
      [employeeId, "ABSENT_WITHOUT_LEAVE"],
    );
  } catch (error) {
    console.error("Failed to send absent without leave email:", error.message);

    // Log failure
    await pool.query(
      `INSERT INTO email_logs (employee_id, type, status, error, attempted_at)
       VALUES ($1, $2, 'FAILED', $3, NOW())`,
      [employeeId, "ABSENT_WITHOUT_LEAVE", error.message],
    );
  }
};

// Check for employees who are late multiple times in a week
const checkAndSendLateNotices = async (threshold = 3) => {
  try {
    console.log("Checking for late notices...");

    // Get employees who were late 3+ times in the past 7 days
    const lateEmployees = await pool.query(
      `
      SELECT
        e.id as employee_id,
        COUNT(*) as late_count,
        ARRAY_AGG(a.date) as late_dates
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      JOIN users u ON u.employee_id = e.id
      WHERE a.status = 'LATE'
        AND a.date >= CURRENT_DATE - INTERVAL '7 days'
        AND u.role != 'ADMIN'
      GROUP BY e.id
      HAVING COUNT(*) >= $1
      `,
      [threshold],
    );

    for (const employee of lateEmployees.rows) {
      // Check if email was already sent this week
      const alreadyNotified = await pool.query(
        `
        SELECT 1 FROM email_logs
        WHERE employee_id = $1
          AND type = 'LATE_NOTICE'
          AND sent_at >= CURRENT_DATE - INTERVAL '7 days'
        LIMIT 1
        `,
        [employee.employee_id],
      );

      if (alreadyNotified.rows.length === 0) {
        await sendLateNoticeEmail(
          employee.employee_id,
          parseInt(employee.late_count),
          employee.late_dates,
        );
      }
    }

    return { success: true, notified: lateEmployees.rows.length };
  } catch (error) {
    console.error("Error checking late notices:", error.message);
    return { success: false, error: error.message };
  }
};

// Check for employees absent without leave
const checkAndSendAbsentWithoutLeaveNotices = async () => {
  try {
    console.log("Checking for absent without leave...");

    // Get employees who are absent today without approved leave
    const absentEmployees = await pool.query(
      `
      SELECT
        e.id as employee_id,
        a.date as absent_date
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      JOIN users u ON u.employee_id = e.id
      WHERE a.status = 'ABSENT'
        AND a.date = CURRENT_DATE
        AND u.role != 'ADMIN'
        AND NOT EXISTS (
          SELECT 1 FROM leave_requests lr
          WHERE lr.employee_id = e.id
            AND lr.from_date <= a.date
            AND lr.to_date >= a.date
            AND lr.status = 'APPROVED'
        )
      `,
    );

    for (const employee of absentEmployees.rows) {
      // Check if email was already sent for this date
      const alreadyNotified = await pool.query(
        `
        SELECT 1 FROM email_logs
        WHERE employee_id = $1
          AND type = 'ABSENT_WITHOUT_LEAVE'
          AND sent_at >= $2
        LIMIT 1
        `,
        [employee.employee_id, employee.absent_date],
      );

      if (alreadyNotified.rows.length === 0) {
        await sendAbsentWithoutLeaveEmail(
          employee.employee_id,
          employee.absent_date,
        );
      }
    }

    return { success: true, notified: absentEmployees.rows.length };
  } catch (error) {
    console.error("Error checking absent without leave:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendLateNoticeEmail,
  sendAbsentWithoutLeaveEmail,
  checkAndSendLateNotices,
  checkAndSendAbsentWithoutLeaveNotices,
};
