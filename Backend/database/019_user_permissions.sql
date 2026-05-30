-- User Permissions Table
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permission_key)
);

-- Grant all permissions to the admin user
INSERT INTO user_permissions (user_id, permission_key, is_allowed)
SELECT u.id, v.key, TRUE
FROM users u
CROSS JOIN (
  VALUES 
    ('dashboard.view'),
    ('employees.view'), ('employees.create'), ('employees.edit'), ('employees.delete'),
    ('attendance.view'), ('attendance.manage'), ('attendance.time_requests.approve'),
    ('leave.view'), ('leave.manage'), ('leave.approve'), ('leave.credits.view'), ('leave.credits.manage'), ('leave.conversion.view'), ('leave.conversion.manage'),
    ('overtime.view'), ('overtime.manage'), ('overtime.approve'),
    ('manhours.view'), ('manhours.manage'), ('manhours.approve'),
    ('payroll.view'), ('payroll.generate'), ('payroll.mark_paid'), ('payroll.settings'), ('payroll.salary.manage'), ('payroll.deductions.manage'),
    ('finalpay.view'), ('finalpay.manage'),
    ('recruitment.view'), ('recruitment.jobs.manage'), ('recruitment.applicants.manage'), ('recruitment.applicants.delete'), ('recruitment.interviews.manage'), ('recruitment.approvals.manage'), ('recruitment.convert_employee'),
    ('performance.view'), ('performance.templates.manage'), ('performance.evaluations.manage'),
    ('forms.view'), ('forms.builder.manage'), ('forms.assignments.manage'), ('forms.submissions.view'),
    ('reports.view'), ('reports.employee'), ('reports.attendance'), ('reports.leave'), ('reports.payroll'), ('reports.benefits'), ('reports.performance'),
    ('settings.view'), ('settings.system'), ('settings.attendance_rules'), ('settings.approvals'), ('settings.notifications'), ('settings.smtp'), ('settings.email_templates'), ('settings.branding'),
    ('users.view'), ('users.manage'),
    ('branches.view'), ('branches.manage'),
    ('devices.view'), ('devices.manage'), ('device_logs.view'),
    ('audit_logs.view'),
    ('anomalies.view'),
    ('analytics.view'),
    ('forecasting.view'),
    ('calendar.view'), ('calendar.manage'),
    ('hr_policies.view'), ('hr_policies.manage'),
    ('notifications.view'),
    ('profile.view'),
    ('change_password')
  ) AS v(key)
WHERE u.username = 'admin'
ON CONFLICT (user_id, permission_key) DO NOTHING;
