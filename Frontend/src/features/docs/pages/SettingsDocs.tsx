import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DocsNavigation from "../components/DocsNavigation";

const SettingsDocs = () => (
  <div className="space-y-8">
    <section id="settings" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">System Settings</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            <strong>System Settings</strong> is where authorized users configure
            company-wide rules for attendance, pay rates, approvals, email, and
            notifications. Changes here affect payroll generation, late handling,
            who can approve requests, and what emails the system sends.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Settings overview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Open <strong>Settings</strong> from the sidebar. The page has
              seven tabs:
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-1">
              <li>
                <strong>Attendance</strong> — late rules and default late
                payroll deductions
              </li>
              <li>
                <strong>Pay Rules</strong> — pay multipliers by calendar day type
              </li>
              <li>
                <strong>Approvals</strong> — who approves overtime, leave, and
                man-hour requests
              </li>
              <li>
                <strong>SMTP</strong> — outgoing email server
              </li>
              <li>
                <strong>Notifications</strong> — which emails are sent and
                login verification
              </li>
              <li>
                <strong>Email Templates</strong> — wording of notification emails
              </li>
              <li>
                <strong>Branding</strong> — company name, logo, colors on payslips
                and emails
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Per-employee salary and deductions are configured under{" "}
              <strong>Payroll → Settings</strong> (Employee Salary Settings), not
              on this page.
            </p>

            
          </div>

          <Separator />

          {/* Attendance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-base">Attendance tab</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Controls how lateness is measured and the <strong>default</strong>{" "}
              late deduction rule used in payroll when an employee does not have
              their own late deduction in Payroll → Settings.
            </p>
            <p className="text-sm font-medium text-foreground">Add a new rule</p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                <strong>Late Threshold</strong> — minutes after shift start before
                someone is marked late.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Grace Period</strong> — extra minutes allowed before
                penalty minutes count.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Max Work Hours</strong> — used when calculating pay per
                day.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Default Late Deduction</strong> — enable, choose Fixed
                (per late) or Per Minute, and set the amount.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Add Rule</strong>.
              </li>
            </ol>
            <p className="text-sm font-medium text-foreground">Manage existing rules</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-1">
              <li>Only one rule can be <strong>Active</strong> at a time.</li>
              <li>
                Use <strong>Activate</strong> on an inactive rule to make it the
                active rule.
              </li>
              <li>
                <strong>Edit</strong> updates thresholds and deduction settings.
              </li>
              <li>
                <strong>Delete</strong> is only available for inactive rules
                and requires the appropriate permission.
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              <strong>Impact:</strong> Attendance records and payroll late
              deductions. Individual employees can still override late rules
              under Payroll → Settings.
            </p>

            
          </div>

          <Separator />

          {/* Pay Rules */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Pay Rules tab</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sets pay <strong>multipliers</strong> for each calendar day type.
              These work together with the company <strong>Calendar</strong> module
              when payroll is generated.
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Click <strong>Add Rule</strong> or edit an existing row.
              </li>
              <li className="leading-relaxed pl-1">
                Choose <strong>Day Type</strong>: Regular Day, Special
                Non-Working Day, Special Holiday, or Regular Holiday.
              </li>
              <li className="leading-relaxed pl-1">
                Set <strong>Multiplier</strong> (for example 1.0 for a normal day,
                2.0 for double pay on a holiday — your company decides the values).
              </li>
              <li className="leading-relaxed pl-1">
                Save. Use delete to remove a rule you no longer need.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              <strong>Impact:</strong> Employee basic pay for a cutoff when
              payroll is generated — holiday and special day pay rates.
            </p>

            
          </div>

          <Separator />

          {/* Approvals */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Approvals tab</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Assigns an <strong>approver</strong> to each employee for a specific
              request type. This controls who sees Manage Overtime, leave
              approvals, and Man Hour approval menus.
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Click <strong>Add Approver</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Select the <strong>Employee</strong> (search by name or code).
              </li>
              <li className="leading-relaxed pl-1">
                Select the <strong>Approver</strong> (another employee).
              </li>
              <li className="leading-relaxed pl-1">
                Choose <strong>Approval Type</strong>: Overtime, Leave, or Man
                Hour.
              </li>
              <li className="leading-relaxed pl-1">
                Create or edit mappings from the table; remove with delete.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              <strong>Impact:</strong> Who can approve overtime, leave, and
              man-hour requests in the app. HR/Admin roles can also approve many
              requests without a mapping.
            </p>

            
          </div>

          <Separator />

          {/* SMTP */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">SMTP tab</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Configures the email server used to send system messages (login
              codes, notifications, payslip queue, etc.).
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Click <strong>Add Configuration</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Enter host, port, encryption (TLS, SSL, or None), username,
                password, from email, and optional from name.
              </li>
              <li className="leading-relaxed pl-1">
                Turn <strong>Active Configuration</strong> on for the profile
                you want to use (only one should be active).
              </li>
              <li className="leading-relaxed pl-1">
                Use <strong>Test</strong> to send a test message to an email
                address you enter.
              </li>
              <li className="leading-relaxed pl-1">
                Edit or delete configurations as needed. When editing, leave
                password blank to keep the existing password.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              <strong>Impact:</strong> Whether notification and login emails can
              be sent. If SMTP is wrong, users may not receive codes or alerts.
            </p>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Notifications tab</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Turn email notifications on or off with switches. Changes save when
              you toggle (no separate Save button on this tab).
            </p>

            <p className="text-sm font-medium text-foreground">Security</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 mb-3">
              <li>
                <strong>2FA Login (Email)</strong> — when enabled, users may need
                a verification code emailed at login (see Login documentation).
              </li>
            </ul>

            <p className="text-sm font-medium text-foreground">Attendance alerts</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 mb-3">
              <li>
                <strong>Late Email Notification</strong> — when enabled, choose
                how many late days (1, 2, 3, 5, or 7) before an alert is sent.
              </li>
              <li>
                <strong>Absent Without Leave Email</strong> — notifies when
                someone is absent without an approved leave on file.
              </li>
            </ul>

            <p className="text-sm font-medium text-foreground">Leave, overtime, payroll</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1">
              <li>Leave approved / rejected</li>
              <li>Overtime approved / rejected</li>
              <li>Payroll marked paid</li>
            </ul>

            
          </div>

          <Separator />

          {/* Email Templates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Email Templates tab</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Edit the subject and body for each notification type. Layout and
              branding come from the Branding tab and fixed email design — you
              edit the message text only.
            </p>
            <p className="text-sm text-muted-foreground">Template types in the app:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 mb-3">
              <li>Overtime Approved / Rejected</li>
              <li>Leave Approved / Rejected</li>
              <li>Payroll Released (marked paid)</li>
              <li>Late Notice</li>
              <li>Absent Without Leave</li>
            </ul>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Select a template tab at the top.
              </li>
              <li className="leading-relaxed pl-1">
                Click variable buttons (for example Employee Name) to insert
                placeholders into the message.
              </li>
              <li className="leading-relaxed pl-1">
                Edit <strong>Subject</strong> and the rich-text body (bold,
                lists, alignment, etc.).
              </li>
              <li className="leading-relaxed pl-1">
                Set <strong>Active</strong> on or off, then click{" "}
                <strong>Save Template</strong>.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              If a template shows <strong>Not Created</strong>, it must be set up
              in the system before you can edit it here.
            </p>

            
          </div>

          <Separator />

          {/* Branding */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Branding tab</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Company name, logo URL, address, colors, and display options for
              payslips and emails. Use sub-tabs <strong>General</strong>,{" "}
              <strong>Colors</strong>, and <strong>Preview</strong>, then click{" "}
              <strong>Save Branding Settings</strong>.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1">
              <li>Company name, logo URL, address (optional)</li>
              <li>Show company name on payslip / in email headers</li>
              <li>Show “Powered by UnivoHR” in email footers</li>
              <li>Primary and secondary colors for email styling</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              <strong>Impact:</strong> How payslips and automated emails look
              to employees.
            </p>

            
          </div>

          <Separator />

          {/* Related - Leave conversion */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">
              Related: Leave conversion settings (separate page)
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Rules for converting unused vacation leave to cash (SIL targets,
              conversion rate, which leave types convert) are <strong>not</strong>{" "}
              on System Settings. These are managed under{" "}
                            <strong>Leaves</strong> (leave settings screen)   →{" "}
              <strong>Conversion Settings</strong> tab, with leave types and
              company conversion options.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Impact:</strong> Leave conversion amounts during payroll
              and final pay.
            </p>
          </div>

          <Separator />



          {/* Important notes */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                Important notes
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  There is no single “Save all” for the whole Settings page — each
                  tab saves its own way (buttons, toggles, or immediate updates).
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Configure SMTP and turn on notifications before expecting email
                  alerts to work.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Pay Rules and Calendar must align — wrong multipliers or missing
                  holidays change payroll results.
                </span>
              </li>
            </ul>
          </div>

          {/* Tips */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-sm text-foreground mb-3">
              Tips &amp; warnings
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-amber-600 shrink-0">⚠</span>
                <span>
                  Changing the <strong>active attendance rule</strong> affects
                  future late calculations — coordinate with HR before switching.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">✓</span>
                <span>
                  After changing Pay Rules or Calendar, review the next payroll
                  run in a test period first if possible.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">✓</span>
                <span>
                  Use SMTP <strong>Test</strong> after any mail server change.
                </span>
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                Troubleshooting
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Validation errors</strong> when adding attendance rules
                  — check negative numbers, max work hours &gt; 0, and deduction
                  value &gt; 0.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot delete attendance rule</strong> — activate
                  another rule first; only inactive rules can be deleted.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Emails not sending</strong> — verify SMTP is active,
                  test connection, and notification toggles are on.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Approver mapping failed</strong> — employee and
                  approver must both be selected; duplicate mappings may be
                  rejected by the server.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Template will not save</strong> — subject and body
                  cannot be empty; template must exist for that type.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/settings" />
  </div>
);

export default SettingsDocs;
