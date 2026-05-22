/**
 * Professional default body_html for email_templates (content only — wrapped by emailWrapper).
 * Placeholders must remain exactly as listed. Copy into Settings → Email Templates if desired.
 */

const detailRow = (label, value) => `
  <div class="email-detail-row">
    <span class="email-detail-label">${label}</span>
    <span class="email-detail-value">${value}</span>
  </div>`;

const EMAIL_TEMPLATE_DEFAULTS = {
  OVERTIME_APPROVED: {
    subject: "Your Overtime Request Has Been Approved",
    body_html: `
      <p class="email-greeting">Hello, {{employee_name}}!</p>
      <p class="email-lead">Your overtime request has been <strong>approved</strong>. Details are below.</p>
      <p><span class="email-status-badge email-status-badge--approved">Approved</span></p>
      <div class="email-detail-card">
        ${detailRow("Date", "{{date}}")}
        ${detailRow("Hours", "{{hours}}")}
        ${detailRow("Reason", "{{reason}}")}
      </div>
      <p>If you have questions, contact your supervisor or HR team.</p>
    `.trim(),
  },

  OVERTIME_REJECTED: {
    subject: "Your Overtime Request Was Not Approved",
    body_html: `
      <p class="email-greeting">Hello, {{employee_name}}!</p>
      <p class="email-lead">Your overtime request was <strong>not approved</strong>. Review the details below.</p>
      <p><span class="email-status-badge email-status-badge--rejected">Rejected</span></p>
      <div class="email-detail-card">
        ${detailRow("Date", "{{date}}")}
        ${detailRow("Hours", "{{hours}}")}
        ${detailRow("Reason", "{{reason}}")}
        ${detailRow("Rejection reason", "{{rejection_reason}}")}
      </div>
      <p>Contact your approver or HR if you need clarification.</p>
    `.trim(),
  },

  LEAVE_APPROVED: {
    subject: "Your Leave Request Has Been Approved",
    body_html: `
      <p class="email-greeting">Hello, {{employee_name}}!</p>
      <p class="email-lead">Your leave request has been <strong>approved</strong>.</p>
      <p><span class="email-status-badge email-status-badge--approved">Approved</span></p>
      <div class="email-detail-card">
        ${detailRow("Leave type", "{{leave_type}}")}
        ${detailRow("From", "{{from_date}}")}
        ${detailRow("To", "{{to_date}}")}
        ${detailRow("Reason", "{{reason}}")}
      </div>
    `.trim(),
  },

  LEAVE_REJECTED: {
    subject: "Your Leave Request Was Not Approved",
    body_html: `
      <p class="email-greeting">Hello, {{employee_name}}!</p>
      <p class="email-lead">Your leave request was <strong>not approved</strong>.</p>
      <p><span class="email-status-badge email-status-badge--rejected">Rejected</span></p>
      <div class="email-detail-card">
        ${detailRow("Leave type", "{{leave_type}}")}
        ${detailRow("From", "{{from_date}}")}
        ${detailRow("To", "{{to_date}}")}
        ${detailRow("Reason", "{{reason}}")}
        ${detailRow("Rejection reason", "{{rejection_reason}}")}
      </div>
    `.trim(),
  },

  PAYROLL_MARKED_PAID: {
    subject: "Your Payslip Is Ready — {{company_name}}",
    body_html: `
      <p class="email-greeting">Hello, {{employee_name}}!</p>
      <p class="email-lead">Your payroll for the period below has been processed and marked as paid.</p>
      <div class="email-detail-card">
        ${detailRow("Company", "{{company_name}}")}
        ${detailRow("Pay period", "{{cutoff_start}} — {{cutoff_end}}")}
        ${detailRow("Net salary", "{{net_salary}}")}
      </div>
      <p>Log in to UnivoHR to view your payroll details in the system.</p>
    `.trim(),
  },

  LATE_NOTICE: {
    subject: "Attendance Notice — Late Arrivals ({{company_name}})",
    body_html: `
      <p class="email-greeting">Hello, {{employee_name}}!</p>
      <p class="email-lead">This is a notice regarding your attendance record for the period below.</p>
      <p><span class="email-status-badge email-status-badge--info">Late attendance notice</span></p>
      <div class="email-detail-card">
        ${detailRow("Late count", "{{late_count}}")}
        ${detailRow("Threshold", "{{threshold}}")}
        ${detailRow("Date range", "{{date_range}}")}
        ${detailRow("Company", "{{company_name}}")}
      </div>
      <div class="email-callout email-callout--info">
        <p>Please ensure timely check-in according to your company attendance policy. Contact HR if you believe this notice is incorrect.</p>
      </div>
    `.trim(),
  },

  ABSENT_WITHOUT_LEAVE: {
    subject: "Attendance Notice — Absence Without Leave ({{company_name}})",
    body_html: `
      <p class="email-greeting">Hello, {{employee_name}}!</p>
      <p class="email-lead">Our records show an absence without an approved leave request.</p>
      <p><span class="email-status-badge email-status-badge--pending">Action required</span></p>
      <div class="email-detail-card">
        ${detailRow("Absence date", "{{absence_date}}")}
        ${detailRow("Company", "{{company_name}}")}
      </div>
      <div class="email-callout email-callout--warning">
        <p>Please coordinate with your supervisor or HR to regularize your attendance or file the appropriate leave request.</p>
      </div>
    `.trim(),
  },

  MAN_HOUR_APPROVED: {
    subject: "Your Man Hour Report Has Been Approved",
    body_html: `
      <p class="email-greeting">Hello, {{employee_name}}!</p>
      <p class="email-lead">Your man hour report has been <strong>approved</strong>.</p>
      <p><span class="email-status-badge email-status-badge--approved">Approved</span></p>
      <div class="email-detail-card">
        ${detailRow("Work date", "{{work_date}}")}
        ${detailRow("Hours", "{{hours}}")}
        ${detailRow("Task", "{{task}}")}
      </div>
    `.trim(),
  },

  MAN_HOUR_REJECTED: {
    subject: "Your Man Hour Report Was Not Approved",
    body_html: `
      <p class="email-greeting">Hello, {{employee_name}}!</p>
      <p class="email-lead">Your man hour report was <strong>not approved</strong>.</p>
      <p><span class="email-status-badge email-status-badge--rejected">Rejected</span></p>
      <div class="email-detail-card">
        ${detailRow("Work date", "{{work_date}}")}
        ${detailRow("Hours", "{{hours}}")}
        ${detailRow("Task", "{{task}}")}
        ${detailRow("Rejection reason", "{{rejection_reason}}")}
      </div>
    `.trim(),
  },
};

module.exports = { EMAIL_TEMPLATE_DEFAULTS };
