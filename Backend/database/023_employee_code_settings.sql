-- Employee Code Generation Settings
INSERT INTO system_settings (key, value, description)
VALUES
  ('employee_code_auto_generate', 'true', 'Enable auto-generation of employee codes'),
  ('employee_code_prefix', 'EMP', 'Prefix for employee codes (e.g., EMP, MCF, STAFF)'),
  ('employee_code_separator', '', 'Separator between prefix and number (e.g., "-" or empty)'),
  ('employee_code_padding', '4', 'Number of zero-padding digits (3, 4, or 5)'),
  ('employee_code_counter', '0', 'Last used counter value; next code = counter + 1')
ON CONFLICT (key) DO NOTHING;
