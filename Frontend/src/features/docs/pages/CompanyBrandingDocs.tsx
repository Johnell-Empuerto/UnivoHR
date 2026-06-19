import { AlertTriangle, CheckCircle2, Info, Users, Building } from "lucide-react";
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

const COMPANY_BRANDING_PATH = "/settings";

const CompanyBrandingDocs = () => (
  <div className="space-y-8">
    <section id="company-branding" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Company Branding Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to set up your company identity in UnivoHR. Company
            branding controls how your organization's name, logo, and colors
            appear on payslips, in email notifications, and across the system.
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
              <Badge variant="secondary">Client Admin</Badge>
              <Badge variant="outline">After password change</Badge>
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
                  <strong>After changing the default admin password</strong> —
                  secure your account first, then configure your company
                  identity.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Before adding branches and employees</strong> — the
                  company name is used in settings, payslips, and emails from
                  the start.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>When the company changes its logo or display name</strong>{" "}
                  — update branding to keep system communications accurate.
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
                  Successfully logged in (see{" "}
                  <strong>First Admin Login Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Changed default admin password (see{" "}
                  <strong>Change Admin Password Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Your company's official name — use the legal registered name
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Your company's official logo — a clear PNG or JPG image hosted
                  at a public URL (logo upload is not supported; you must
                  provide a link to your logo)
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Step-by-step guide</h3>
            </div>
            <ol className="space-y-4 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open System Settings.</strong> From the sidebar menu on
                the left, click <strong>Settings</strong>. The System Settings
                page opens.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Branding tab.</strong> Below the page heading,
                a row of tabs is displayed. Click the{" "}
                <strong>Branding</strong> tab. The Company Branding card
                appears with three sub-tabs: General, Colors, and Preview.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the company name.</strong> Make sure the{" "}
                <strong>General</strong> tab is selected. Click the{" "}
                <strong>Company Name</strong> field and type your official
                company name. This name will appear on payslips and in email
                headers.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the company logo URL.</strong> Click the{" "}
                <strong>Company Logo URL</strong> field and paste the web
                address of your company logo image. The logo must be hosted at
                a public URL (for example, your company website). A preview of
                the logo appears below the field. If the image does not load,
                check that the URL is correct and publicly accessible. Click
                the <strong>X</strong> button beside the field to remove the
                logo if needed.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the company address (optional).</strong> Click the{" "}
                <strong>Company Address</strong> field and type your company's
                business address. This appears in email footers.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Configure display settings.</strong> Use the toggle
                switches below the address field to control where your company
                name appears:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Show Company Name on Payslip</strong> — displays
                    the company name on employee payslips
                  </li>
                  <li>
                    <strong>Show Company Name in Email</strong> — displays the
                    company name in email notification headers
                  </li>
                  <li>
                    <strong>Show "Powered by UnivoHR"</strong> — displays
                    attribution in email footers
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Configure colors (optional).</strong> Click the{" "}
                <strong>Colors</strong> sub-tab. You can set:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Primary Color</strong> — used for email headers and
                    buttons. Type a hex color code (e.g.,{" "}
                    <span className="font-mono">#4F46E5</span>) or use the
                    color picker.
                  </li>
                  <li>
                    <strong>Secondary Color</strong> — used for email header
                    gradients. Type a hex color code (e.g.,{" "}
                    <span className="font-mono">#7C3AED</span>) or use the
                    color picker.
                  </li>
                </ul>
                An invalid hex code shows an error icon next to the field.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Preview your branding.</strong> Click the{" "}
                <strong>Preview</strong> sub-tab to see how your branding will
                look. Two previews are shown:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Email Header Preview</strong> — shows the logo,
                    company name, and colors as they will appear in email
                    notifications
                  </li>
                  <li>
                    <strong>Payslip Preview</strong> — shows the company name
                    as it will appear on employee payslips
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Save Branding Settings.</strong> Click the{" "}
                <strong>Save Branding Settings</strong> button at the bottom of
                the card. The button changes to <strong>Saving...</strong> with
                a spinner while the system saves. Do not click the button
                multiple times.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Confirm branding was updated.</strong> A green success
                message appears at the top of the screen saying{" "}
                <strong>Company branding saved successfully</strong>. Your
                company name and logo will now appear in payslips, emails, and
                other system communications. Refresh the page if changes do not
                appear immediately.
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
                  Use your <strong>official company name</strong> exactly as it
                  appears on legal documents.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  There is no file upload for logos. You must provide a{" "}
                  <strong>public URL</strong> to an image hosted online (e.g.,
                  on your company website).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  If the company name is left empty, the system will use{" "}
                  <strong>UnivoHR</strong> as the fallback name on payslips and
                  emails.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Branding should be configured <strong>before employees start
                  using the system</strong> so all communications use the
                  correct identity.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Only admin users with the <strong>Company Branding</strong>{" "}
                  permission can access this section.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If branding update fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Logo URL is not accepted</strong> — Make sure the URL
                  points to a valid image (PNG or JPG) that is publicly
                  accessible.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Invalid hex color</strong> — Use a valid hex code
                  starting with <span className="font-mono">#</span> followed
                  by 6 characters (0–9, A–F). An error icon appears next to
                  invalid entries.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Changes did not appear</strong> — Refresh the page.
                  If the logo still does not appear, check that the image URL
                  is correct and publicly accessible.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Permission denied</strong> — Only admins with the
                  Company Branding permission can update these settings. Ask
                  your system administrator if you cannot see the Branding tab.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/company-branding" />
  </div>
);

export default CompanyBrandingDocs;
