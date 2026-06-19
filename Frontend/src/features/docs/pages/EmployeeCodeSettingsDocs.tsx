import { AlertTriangle, CheckCircle2, Info, Users, Hash } from "lucide-react";
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

const EmployeeCodeSettingsDocs = () => (
  <div className="space-y-8">
    <section id="employee-code-settings" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Employee Code Settings Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to configure how employee ID codes are automatically
            generated in UnivoHR. Employee codes uniquely identify each
            employee and are used in records, reports, payroll, attendance, and
            device mapping. These settings should be configured before creating
            employees.
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
              <Badge variant="outline">Before creating employees</Badge>
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
                  <strong>After creating branches</strong> — configure employee
                  code rules before you start adding employee records.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Before creating employees</strong> — the code format
                  you set will apply to all new employee records.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>When the company wants a specific ID format</strong>{" "}
                  — choose a prefix, separator, and number style that your
                  organization recognizes.
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
                  Successfully logged in and created branches (see{" "}
                  <strong>Branch Setup Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  A decision on your employee code format — including prefix
                  (e.g., <span className="font-mono">EMP</span>), separator
                  (e.g., <span className="font-mono">-</span>), and number of
                  digits
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  A starting counter number — usually <strong>1</strong> if no
                  employees exist yet
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
                <strong>Open the Employee Codes tab.</strong> Below the page
                heading, click the <strong>Employee Codes</strong> tab. The
                Employee Code Generation card appears.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enable or disable auto generation.</strong> Use the
                toggle labeled{" "}
                <strong>Enable Auto Generation</strong>. When enabled, the
                system automatically creates employee codes for new employees.
                When disabled, you must type the code manually when creating
                each employee.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set a prefix (optional).</strong> Click the{" "}
                <strong>Prefix</strong> field and type a short label that
                appears at the start of the code (e.g.,{" "}
                <span className="font-mono">EMP</span>,
                <span className="font-mono">HR</span>,
                <span className="font-mono">MNL</span>). If left blank, codes
                will be purely numeric. If prefix is empty while auto
                generation is on, a warning message will appear — this is
                normal.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set a separator (optional).</strong> Click the{" "}
                <strong>Separator</strong> field and type a character that
                goes between the prefix and the number (e.g.,{" "}
                <span className="font-mono">-</span>,
                <span className="font-mono">/</span>,
                <span className="font-mono">.</span>,
                <span className="font-mono">_</span>). Leave blank for no
                separator.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Choose the number format.</strong> Click the{" "}
                <strong>Number Format</strong> dropdown and select how many
                digits the number should have:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>No zero padding (1)</strong> — numbers appear as 1,
                    2, 3, etc.
                  </li>
                  <li>
                    <strong>3 digits (001)</strong> — numbers appear as 001,
                    002, etc.
                  </li>
                  <li>
                    <strong>4 digits (0001)</strong> — numbers appear as 0001,
                    0002, etc.
                  </li>
                  <li>
                    <strong>5 digits (00001)</strong> — numbers appear as
                    00001, 00002, etc.
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set the current counter.</strong> Click the{" "}
                <strong>Current Counter</strong> field and enter the last used
                number. The next employee will get this number plus one. If no
                employees exist yet, set it to <strong>0</strong> so the first
                code starts at 1. This field is required.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Check the preview.</strong> In the{" "}
                <strong>Preview</strong> section, click{" "}
                <strong>Check Next Code</strong> to see what the next employee
                code will look like. Review the format, next number, and
                preview code before saving.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Save All Settings.</strong> Click the{" "}
                <strong>Save All Settings</strong> button at the bottom of the
                card. The button changes to{" "}
                <strong>Saving All Settings...</strong> with a spinner while
                the system saves. Do not click the button multiple times.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Confirm the settings were saved.</strong> A green
                success message appears saying{" "}
                <strong>Employee code settings saved successfully</strong>.
                The settings apply immediately to all new employee records.
                Existing employee codes will not be changed.
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
                  <strong>Configure before creating employees.</strong> The
                  format you set here applies to all new employee records from
                  that point forward.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Existing codes will not change.</strong> If you
                  change the format after employees already exist, their codes
                  stay the same.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Use <strong>simple, clear prefixes</strong> that HR and
                  payroll staff can easily recognize.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Employee codes must be <strong>unique</strong>. The auto
                  generation system prevents duplicates automatically.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  When auto generation is on, leave the Employee Code field
                  blank when creating an employee — the system fills it in
                  automatically.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If settings fail
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Current counter is invalid</strong> — Enter a valid
                  number (0 or higher). This field is required.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Settings did not save</strong> — Make sure you clicked{" "}
                  <strong>Save All Settings</strong>. Check your connection and
                  try again.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Permission denied</strong> — Only users with
                   System Settings permission can update employee code
                  settings.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/employee-code-settings" />
  </div>
);

export default EmployeeCodeSettingsDocs;
