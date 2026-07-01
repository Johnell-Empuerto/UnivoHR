// services/attendanceNotification.service.js
const pool = require("../config/db");
const smtpService = require("./smtp.service");
const notificationDispatch = require("./notificationDispatch.service");
const notificationRuleService = require("./notificationRule.service");
const emailTemplateService = require("./emailTemplate.service");
const logger = require("../utils/logger");

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
    const allowed = await notificationDispatch.canSendEmail("late_notice");

    if (!allowed) {
      logger.info("Late email notice is disabled via notification_rules");
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
      logger.info(`No email found for employee ${employeeId}`);
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
    logger.info(
      `Late notice email sent to ${employee.email} for ${lateCount} late occurrences`,
    );

    // Log success
    await pool.query(
      `INSERT INTO email_logs (employee_id, type, status, sent_at)
       VALUES ($1, $2, 'SENT', NOW())`,
      [employeeId, "LATE_NOTICE"],
    );
  } catch (error) {
    logger.error({ err: error }, "Failed to send late notice email");

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
    const allowed = await notificationDispatch.canSendEmail("absent_no_leave");

    if (!allowed) {
      logger.info("Absent without leave email is disabled via notification_rules");
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
      logger.info(`No email found for employee ${employeeId}`);
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
    logger.info(
      `Absent without leave email sent to ${employee.email} for ${formatDate(absentDate)}`,
    );

    // Log success
    await pool.query(
      `INSERT INTO email_logs (employee_id, type, status, sent_at)
       VALUES ($1, $2, 'SENT', NOW())`,
      [employeeId, "ABSENT_WITHOUT_LEAVE"],
    );
  } catch (error) {
    logger.error({ err: error }, "Failed to send absent without leave email");

    // Log failure
    await pool.query(
      `INSERT INTO email_logs (employee_id, type, status, error, attempted_at)
       VALUES ($1, $2, 'FAILED', $3, NOW())`,
      [employeeId, "ABSENT_WITHOUT_LEAVE", error.message],
    );
  }
};

// Check for employees who are late multiple times within the configured window
const checkAndSendLateNotices = async (threshold = 3) => {
  try {
    const rule = await notificationRuleService.getRuleByKey("late_notice");

    const isEnabled = rule?.is_enabled ?? true;
    if (!isEnabled) {
      logger.info("[LateNotice] Disabled via notification_rules, skipping");
      return { success: true, skipped: true };
    }

    const emailEnabled = rule?.email_enabled ?? false;
    const thresholdCount = Number(rule?.threshold_count ?? threshold);
    const thresholdDays = Number(rule?.threshold_days ?? 7);

    logger.info(`[LateNotice] threshold_count=${thresholdCount}, threshold_days=${thresholdDays}, email=${emailEnabled}`);

    // Get employees who were late thresholdCount+ times in the past thresholdDays days
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
        AND a.date >= CURRENT_DATE - $2::INTEGER
        AND u.role != 'ADMIN'
      GROUP BY e.id
      HAVING COUNT(*) >= $1
      `,
      [thresholdCount, thresholdDays],
    );

    for (const employee of lateEmployees.rows) {
      // Check if email was already sent within the same lookback window
      const alreadyNotified = await pool.query(
        `
        SELECT 1 FROM email_logs
        WHERE employee_id = $1
          AND type = 'LATE_NOTICE'
          AND sent_at >= CURRENT_DATE - $2::INTEGER
        LIMIT 1
        `,
        [employee.employee_id, thresholdDays],
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
    logger.error({ err: error }, "Error checking late notices");
    return { success: false, error: error.message };
  }
};

// Check for employees absent without leave
const checkAndSendAbsentWithoutLeaveNotices = async () => {
  try {
    const rule = await notificationRuleService.getRuleByKey("absent_no_leave");

    const isEnabled = rule?.is_enabled ?? true;
    if (!isEnabled) {
      logger.info("[AbsentNoLeave] Disabled via notification_rules, skipping");
      return { success: true, skipped: true };
    }

    const emailEnabled = rule?.email_enabled ?? false;
    if (!emailEnabled) {
      logger.info("[AbsentNoLeave] Email disabled via notification_rules, skipping");
      return { success: true, skipped: true };
    }

    logger.info("Checking for absent without leave...");

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
          SELECT 1 FROM leaves lr
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
    logger.error({ err: error }, "Error checking absent without leave");
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendLateNoticeEmail,
  sendAbsentWithoutLeaveEmail,
  checkAndSendLateNotices,
  checkAndSendAbsentWithoutLeaveNotices,
};
