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

const SMTPSettingsDocs = () => (
  <div className="space-y-8">
    <section id="smtp-settings" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">SMTP Settings Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to connect UnivoHR to your company email server using
            SMTP settings. Email notifications are used for approval requests,
            system alerts, and other automated messages. Without a working
            SMTP configuration, users will not receive email notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Administrator</Badge>
              <Badge variant="outline">After approval settings</Badge>
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
                  <strong>First-time setup</strong> — before email
                  notifications can work, SMTP must be configured.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Email provider change</strong> — when switching
                  email services or updating credentials.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Testing configuration</strong> — verify your SMTP
                  setup is working before relying on email notifications.
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
                  Your SMTP server hostname or IP address (e.g., smtp.gmail.com)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  SMTP port number (typically 587 for TLS, 465 for SSL)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Username and password for the SMTP account
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  The <strong>settings.smtp</strong> permission to access the
                  SMTP tab
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding an SMTP configuration
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open System Settings.</strong> From the sidebar menu,
                click <strong>Settings</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the SMTP tab.</strong> Click the{" "}
                <strong>SMTP</strong> tab. The{" "}
                <strong>SMTP Configuration</strong> card appears with the
                subtitle:{" "}
                <em>Configure email server settings for system notifications</em>
                . If no configuration exists, you will see{" "}
                <em>No SMTP Configuration</em> with the message{" "}
                <em>Add your first SMTP configuration to enable email
                notifications</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Configuration.</strong> Click the{" "}
                <strong>Add Configuration</strong> button. The{" "}
                <strong>Add SMTP Configuration</strong> dialog opens with the
                description:{" "}
                <em>Configure your email server settings for sending
                notifications</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in the required fields:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>SMTP Host *</strong> — the server address
                    (placeholder: smtp.gmail.com)
                  </li>
                  <li>
                    <strong>Port *</strong> — the server port
                    (placeholder: 587)
                  </li>
                  <li>
                    <strong>Encryption *</strong> — select from:{" "}
                    <strong>TLS (Recommended)</strong>, <strong>SSL</strong>,
                    or <strong>None</strong>
                  </li>
                  <li>
                    <strong>Username *</strong> — the email address or login
                    (placeholder: your-email@gmail.com)
                  </li>
                  <li>
                    <strong>Password *</strong> — the email account password
                    (placeholder: Enter password)
                  </li>
                  <li>
                    <strong>From Email *</strong> — the sender email address
                    (placeholder: noreply@yourcompany.com)
                  </li>
                  <li>
                    <strong>From Name</strong> — optional display name
                    (placeholder: HRMS System)
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set as active (optional).</strong> Toggle the{" "}
                <strong>Active Configuration</strong> switch on to make this
                the active SMTP configuration. Only one configuration can be
                active at a time.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save.</strong> Click the <strong>Create</strong>{" "}
                button. A green message says{" "}
                <strong>SMTP settings created successfully</strong>. The new
                configuration appears as a card with details.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Testing the SMTP configuration
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                On the configuration card, click the{" "}
                <strong>Test</strong> button (with Send icon).
              </li>
              <li className="leading-relaxed pl-1">
                The <strong>Send Test Email</strong> dialog opens with the
                description:{" "}
                <em>Send a test email to verify your SMTP configuration</em>.
              </li>
              <li className="leading-relaxed pl-1">
                Enter the recipient email in the{" "}
                <strong>Test Email Address *</strong> field (placeholder:{" "}
                admin@yourcompany.com). The helper text says:{" "}
                <em>A test email will be sent to this address to verify SMTP
                settings</em>.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Send Test Email</strong>. A green message says{" "}
                <strong>
                  Test email sent successfully! Check your inbox.
                </strong>
                . The card shows a <strong>Tested ✓</strong> badge and the
                last test date.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Editing or deleting an SMTP configuration
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Edit a configuration.</strong> Click the{" "}
                <strong>Edit</strong> icon on the configuration card. The{" "}
                <strong>Edit SMTP Configuration</strong> dialog opens with
                current values pre-filled. The Password field shows{" "}
                <em>Leave blank to keep existing password</em>.
              </li>
              <li className="leading-relaxed pl-1">
                Make your changes and click <strong>Update</strong>. A green
                message says{" "}
                <strong>SMTP settings updated successfully</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Delete a configuration.</strong> Click the{" "}
                <strong>Delete</strong> icon (Trash2). A confirmation prompt
                says{" "}
                <em>Are you sure you want to delete these SMTP settings?</em>
                . Click OK to confirm. A green message says{" "}
                <strong>SMTP settings deleted successfully</strong>.
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
                  <strong>One active configuration:</strong> Only one SMTP
                  configuration can be active at a time. The Active
                  Configuration toggle controls this.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Always test:</strong> After creating or updating
                  SMTP settings, use the Test button to verify the
                  configuration works before relying on it.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Password security:</strong> On edit, the password
                  field is blank. Leave it empty to keep the existing
                  password.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Common ports:</strong> Port 587 with TLS is the most
                  common for secure email submission. Port 465 uses SSL
                  directly.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If SMTP setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>SMTP tab not visible</strong> — Your account may not
                  have the <strong>settings.smtp</strong> permission.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Validation errors on save</strong> — Required fields
                  are marked with an asterisk. Make sure Host, Port, Username,
                  Password, and From Email are all filled in.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Test email fails</strong> — Check your SMTP server
                  credentials, port number, and encryption type. Also verify
                  that your email provider allows SMTP access.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/smtp-settings" />
  </div>
);

export default SMTPSettingsDocs;
