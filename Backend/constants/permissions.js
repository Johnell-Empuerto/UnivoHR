const ALL_PERMISSIONS = [
  'dashboard.view',

  'employees.view',
  'employees.create',
  'employees.edit',
  'employees.delete',

  'attendance.view',
  'attendance.manage',
  'attendance.time_requests.approve',

  'leave.view',
  'leave.manage',
  'leave.approve',
  'leave.credits.view',
  'leave.credits.manage',
  'leave.conversion.view',
  'leave.conversion.manage',

  'overtime.view',
  'overtime.manage',
  'overtime.approve',

  'manhours.view',
  'manhours.manage',
  'manhours.approve',

  'payroll.view',
  'payroll.generate',
  'payroll.mark_paid',
  'payroll.settings',
  'payroll.salary.manage',
  'payroll.deductions.manage',

  'finalpay.view',
  'finalpay.manage',

  'recruitment.view',
  'recruitment.jobs.manage',
  'recruitment.applicants.manage',
  'recruitment.applicants.delete',
  'recruitment.interviews.manage',
  'recruitment.approvals.manage',
  'recruitment.convert_employee',

  'performance.view',
  'performance.templates.manage',
  'performance.evaluations.manage',

  'forms.view',
  'forms.builder.manage',
  'forms.assignments.manage',
  'forms.submissions.view',

  'reports.view',
  'reports.employee',
  'reports.attendance',
  'reports.leave',
  'reports.payroll',
  'reports.benefits',
  'reports.performance',

  'settings.view',
  'settings.system',
  'settings.attendance_rules',
  'settings.approvals',
  'settings.notifications',
  'settings.smtp',
  'settings.email_templates',
  'settings.branding',

  'users.view',
  'users.manage',

  'branches.view',
  'branches.manage',

  'devices.view',
  'devices.manage',
  'device_logs.view',

  'audit_logs.view',
  'anomalies.view',
  'analytics.view',
  'forecasting.view',

  'calendar.view',
  'calendar.manage',

  'hr_policies.view',
  'hr_policies.manage',

  'notifications.view',
  'profile.view',
  'change_password',
];

const PERMISSION_GROUPS = {
  Dashboard: ['dashboard.view'],
  Employees: ['employees.view', 'employees.create', 'employees.edit', 'employees.delete'],
  Attendance: ['attendance.view', 'attendance.manage', 'attendance.time_requests.approve'],
  Leave: ['leave.view', 'leave.manage', 'leave.approve', 'leave.credits.view', 'leave.credits.manage', 'leave.conversion.view', 'leave.conversion.manage'],
  Overtime: ['overtime.view', 'overtime.manage', 'overtime.approve'],
  'Man Hours': ['manhours.view', 'manhours.manage', 'manhours.approve'],
  Payroll: ['payroll.view', 'payroll.generate', 'payroll.mark_paid', 'payroll.settings', 'payroll.salary.manage', 'payroll.deductions.manage'],
  'Final Pay': ['finalpay.view', 'finalpay.manage'],
  Recruitment: ['recruitment.view', 'recruitment.jobs.manage', 'recruitment.applicants.manage', 'recruitment.applicants.delete', 'recruitment.interviews.manage', 'recruitment.approvals.manage', 'recruitment.convert_employee'],
  Performance: ['performance.view', 'performance.templates.manage', 'performance.evaluations.manage'],
  Forms: ['forms.view', 'forms.builder.manage', 'forms.assignments.manage', 'forms.submissions.view'],
  Reports: ['reports.view', 'reports.employee', 'reports.attendance', 'reports.leave', 'reports.payroll', 'reports.benefits', 'reports.performance'],
  Settings: ['settings.view', 'settings.system', 'settings.attendance_rules', 'settings.approvals', 'settings.notifications', 'settings.smtp', 'settings.email_templates', 'settings.branding'],
  Users: ['users.view', 'users.manage'],
  Branches: ['branches.view', 'branches.manage'],
  Devices: ['devices.view', 'devices.manage', 'device_logs.view'],
  'Audit Logs': ['audit_logs.view'],
  Anomalies: ['anomalies.view'],
  Analytics: ['analytics.view'],
  Forecasting: ['forecasting.view'],
  Calendar: ['calendar.view', 'calendar.manage'],
  'HR Policies': ['hr_policies.view', 'hr_policies.manage'],
  Notifications: ['notifications.view'],
  Profile: ['profile.view', 'change_password'],
};

module.exports = { ALL_PERMISSIONS, PERMISSION_GROUPS };
