import { AlertTriangle, CheckCircle2, Info, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DocsNavigation from "../components/DocsNavigation";

const moduleLabels = [
  { module: "Security", rules: "Login OTP email notification" },
  { module: "Attendance Alerts", rules: "Late notice, absent without leave, anomalies (late, missing checkout, undertime, excessive OT, time modification, rejection), statistics (moving average, attendance rate, absenteeism spike)" },
  { module: "Leave Notifications", rules: "Leave approved/rejected, frequent leave anomaly, leave around absence, leave frequency period" },
  { module: "Overtime Notifications", rules: "Overtime approved/rejected, repeated rejected overtime, overtime history period" },
  { module: "Man Hours Notifications", rules: "Man hour approved/rejected, excessive man hours, repeated man hour edits" },
  { module: "Payroll Notifications", rules: "Payroll marked paid, salary change anomaly, deduction change anomaly" },
];

const NotificationSettingsDocs = () => (
  <div className="space-y-8">
    <section id="notification-settings" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Notification Settings Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to configure in-app and email notifications in
            UnivoHR. Notification Settings let you choose which system events
            trigger alerts for users, how often they are sent, and whether
            they appear inside the application, via email, or both.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">System Administrator</Badge>
              <Badge variant="secondary">HR Admin</Badge>
              <Badge variant="outline">After email templates</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">When to use this guide</h3>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>After SMTP and email templates</strong> — turn on
                  notifications for specific system events.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>New events introduced</strong> — when new anomaly
                  detection or notification types are added, configure them
                  here.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Reduce noise</strong> — adjust frequency and
                  thresholds to avoid overwhelming users with alerts.
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Configuring notification settings
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open System Settings.</strong> From the sidebar, click{" "}
                <strong>Settings</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Notifications tab.</strong> Click the{" "}
                <strong>Notifications</strong> tab. The{" "}
                <strong>Notification Settings</strong> card appears with the
                description:{" "}
                <em>Configure in-app and email notifications for various
                system events</em>. All settings are organized into module
                sections.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Find the section you want.</strong> Settings are
                grouped into the following sections:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  {moduleLabels.map((m) => (
                    <li key={m.module}>
                      <strong>{m.module}</strong> — {m.rules}
                    </li>
                  ))}
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Toggle notifications on or off.</strong> Each
                notification rule has two switches:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>In-App</strong> — notifications appear inside the
                    application (bell icon in the top bar)
                  </li>
                  <li>
                    <strong>Email</strong> — notifications are sent via email
                    (requires SMTP to be configured)
                  </li>
                </ul>
                Changes are saved immediately — there is no separate Save
                button.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set the frequency.</strong> For each rule, choose how
                often to send notifications:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li><strong>Immediate</strong> — send as soon as the event occurs</li>
                  <li><strong>Daily</strong> — send once per day in a digest</li>
                  <li><strong>Weekly</strong> — send once per week</li>
                  <li><strong>Monthly</strong> — send once per month</li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Configure thresholds (if applicable).</strong> Some
                anomaly detection rules have threshold fields:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Count</strong> — number of occurrences (e.g., 3
                    late arrivals) before triggering
                  </li>
                  <li>
                    <strong>Days</strong> — the time window in days (e.g.,
                    within 7 days)
                  </li>
                  <li>
                    <strong>Hours</strong> — maximum hours threshold (e.g., 4
                    hours of overtime)
                  </li>
                  <li>
                    <strong>Percent</strong> — percentage change threshold
                    (e.g., 30% salary change)
                  </li>
                </ul>
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Security: Login OTP
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The <strong>Security</strong> section contains a single rule:{" "}
              <strong>Login OTP Email</strong>. This sends a one-time
              password via email when a user logs in. It has only an Email
              toggle (no In-App toggle), since the OTP is delivered by email.
            </p>
          </div>

          <Separator />

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                Important notes
              </h3>
            </div>
            <ul className="space-y-1 text-sm text-blue-800/90 dark:text-blue-300/90">
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Changes save immediately:</strong> Toggling a switch
                  or changing a threshold saves instantly. A green message
                  says <strong>Setting updated successfully</strong>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Email notifications require SMTP:</strong> If SMTP
                  is not configured, email toggles will appear but emails will
                  not be delivered.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Template content matters:</strong> The actual email
                  content is controlled by the Email Template Editor. Make
                  sure templates are created and activated for the
                  notification types you enable here.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Anomaly detection:</strong> Rules with "Anomaly" in
                  their name are for detecting unusual patterns. Configure
                  thresholds carefully to avoid false positives.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If notification setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Notifications tab not visible</strong> — Your
                  account may not have the{" "}
                  <strong>settings.notifications</strong> permission.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Failed to update setting</strong> — The change could
                  not be saved. Try again or check your connection.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Emails not being sent</strong> — Check SMTP settings
                  and email template activation.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/notification-settings" />
  </div>
);

export default NotificationSettingsDocs;
