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

const EmailTemplatesDocs = () => (
  <div className="space-y-8">
    <section id="email-templates" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Email Templates Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to customize email notification content in UnivoHR. The
            Email Template Editor lets you write the subject line and body for
            system emails such as approval notifications, late notices, and
            payroll alerts. The email layout and branding are fixed — only the
            content area is customizable.
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
              <Badge variant="outline">After SMTP setup</Badge>
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
                  <strong>After SMTP is configured</strong> — customize what
                  your users see in their email notifications.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Branding updates</strong> — when you want to change
                  the message tone or content of automated emails.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>New template types added</strong> — when new
                  notification types become available, customize them before
                  activation.
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Before you start</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Make sure you have the following ready:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  SMTP settings configured and tested (see{" "}
                  <strong>SMTP Settings Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  The <strong>settings.email_templates</strong> permission to
                  access the Email Templates tab
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Draft text for each email type you want to customize
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Understanding template types
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              There are nine template types available. Each has its own
              subject and content, and can be independently activated or
              deactivated.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Overtime Approved</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sent when an overtime request is approved
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Overtime Rejected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sent when an overtime request is rejected
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Leave Approved</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sent when a leave request is approved
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Leave Rejected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sent when a leave request is rejected
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Man Hour Approved</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sent when a man hour report is approved
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Man Hour Rejected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sent when a man hour report is rejected
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Payroll Released</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sent when payroll is marked as paid
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Late Notice</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sent when late attendance exceeds threshold
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Absent Without Leave</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sent when an employee is absent without leave
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Editing an email template
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open System Settings.</strong> From the sidebar menu,
                click <strong>Settings</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Email Templates tab.</strong> Click the{" "}
                <strong>Email Templates</strong> tab. The{" "}
                <strong>Email Template Editor</strong> page opens with the
                subtitle:{" "}
                <em>Customize email content for system notifications (layout
                and branding are fixed)</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select a template type.</strong> Click one of the
                template type tabs at the top (e.g.,{" "}
                <strong>Leave Approved</strong>). A badge shows the current
                status: <strong>Active</strong> (green),{" "}
                <strong>Inactive</strong> (gray), or{" "}
                <strong>Not Created</strong> (yellow).
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the email subject.</strong> In the{" "}
                <strong>Email Subject</strong> field, type the subject line
                (placeholder: <em>Enter email subject</em>).
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Write the email content.</strong> In the rich text
                editor area, compose your message. Use the toolbar for
                formatting: Bold, Italic, Underline, Strikethrough, Heading 1,
                Heading 2, Align Left/Center/Right, Bullet List, Numbered
                List, and Quote.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Insert dynamic variables.</strong> Click any{" "}
                <strong>Available Variables</strong> button (e.g.,{" "}
                <code className="text-xs">{"{{employee_name}}"}</code>,{" "}
                <code className="text-xs">{"{{date}}"}</code>,{" "}
                <code className="text-xs">{"{{hours}}"}</code>) to insert it
                into the email body. These are replaced with real data when
                the email is sent.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Preview your content.</strong> Toggle{" "}
                <strong>Preview Mode</strong> to see how the email will look
                to recipients. Toggle back to{" "}
                <strong>Edit Mode</strong> to continue editing.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Activate the template (optional).</strong> Turn the{" "}
                <strong>Active Template</strong> switch on to make this
                template active. Only active templates are used for
                notifications.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save.</strong> Click the{" "}
                <strong>Save Template</strong> button. A green message says{" "}
                <strong>Template updated successfully</strong>.
              </li>
            </ol>
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
                  <strong>Layout is fixed:</strong> The email header, footer,
                  and colors are not editable here. Only the subject and
                  content area are customizable.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Subject and body are required:</strong> You cannot
                  save a template without both a subject and body content.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Save before activating:</strong> You need to save
                  the template first before you can toggle it to active.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Variables per type:</strong> Each template type has
                  its own set of available variables. For example, Leave
                  templates have{" "}
                  <code className="text-xs">{"{{leave_type}}"}</code> and{" "}
                  <code className="text-xs">{"{{from_date}}"}</code>, while
                  Payroll templates have{" "}
                  <code className="text-xs">{"{{net_salary}}"}</code>.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If email template setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Email Templates tab not visible</strong> — Your
                  account may not have the{" "}
                  <strong>settings.email_templates</strong> permission.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Subject is required</strong> — You must enter a
                  subject before saving.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Email body is required</strong> — The content area
                  cannot be empty.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Save the template first before toggling</strong> —
                  Create the template first, then activate it.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/email-templates" />
  </div>
);

export default EmailTemplatesDocs;
