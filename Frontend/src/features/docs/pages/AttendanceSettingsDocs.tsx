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

const AttendanceSettingsDocs = () => (
  <div className="space-y-8">
    <section id="attendance-settings" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Attendance Settings Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to configure attendance rules in UnivoHR. These settings
            control how clock-in/out works, when employees are marked late,
            how grace periods are applied, and whether web-based clock-in is
            available.
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
              <Badge variant="secondary">Administrator — permission</Badge>
              <Badge variant="secondary">Client Admin</Badge>
              <Badge variant="outline">Before shift setup</Badge>
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
                  <strong>After Timezone Settings</strong> — configure
                  attendance rules before creating shifts and before employees
                  start clocking in.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>When company attendance rules change</strong> —
                  update late thresholds, grace periods, or deduction rules as
                  needed.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>When enabling or disabling web clock-in/out</strong>{" "}
                  — control whether employees can clock in and out from the
                  browser.
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
                  Successfully logged in and finished timezone settings (see{" "}
                  <strong>Timezone Settings Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Decided your late threshold — how many minutes after shift
                  start before an employee is marked late
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Decided your grace period — how many minutes of delay are
                  allowed without penalty
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Decided max work hours per day for salary computation and a
                  late deduction rule if applicable
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
                the left, click <strong>Settings</strong>. The{" "}
                <strong>Attendance</strong> tab is selected by default.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Configure Web Clock In/Out (optional).</strong> At the
                top of the Attendance tab, you will see the{" "}
                <strong>Web Clock In / Clock Out</strong> section with a toggle
                that says{" "}
                <em>Allow employees to clock in and clock out using the web
                application</em>. Turn this toggle ON to let employees clock
                in/out from their browser dashboard. Turn it OFF to restrict
                clock-in to attendance devices only. The change saves
                immediately.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Add a new attendance rule.</strong> Below the Web Clock
                section, locate the{" "}
                <strong>Add New Attendance Rule</strong> section. Fill in the
                following fields:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Late Threshold *</strong> — enter the number of
                    minutes after the shift start time before an employee is
                    marked late (e.g., <span className="font-mono">15</span>).
                    Cannot be negative.
                  </li>
                  <li>
                    <strong>Grace Period *</strong> — enter the number of
                    minutes of delay allowed without penalty (e.g.,{" "}
                    <span className="font-mono">5</span>). Cannot be negative.
                  </li>
                  <li>
                    <strong>Max Work Hours *</strong> — enter the maximum work
                    hours per day used for salary computation (e.g.,{" "}
                    <span className="font-mono">8</span> or{" "}
                    <span className="font-mono">8.5</span>). Must be greater
                    than 0.
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Configure late deduction (optional).</strong> Check{" "}
                <strong>Enable Late Deduction</strong> if you want to deduct
                pay for late arrivals. Then select:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Deduction Type</strong> — choose{" "}
                    <strong>Fixed Amount (per late)</strong> to deduct a fixed
                    amount each time the employee is late, or{" "}
                    <strong>Per Minute Deduction</strong> to deduct per minute
                    of lateness.
                  </li>
                  <li>
                    <strong>Deduction Value</strong> — enter the amount in
                    pesos (e.g., <span className="font-mono">50</span>). Must
                    be greater than 0.
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Rule.</strong> Click the{" "}
                <strong>Add Rule</strong> button. The button changes to{" "}
                <strong>Creating...</strong> while the system saves. A green
                message says{" "}
                <strong>Attendance rule created successfully</strong>. The new
                rule appears in the <strong>Attendance Rules</strong> table
                below.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Activate the rule.</strong> In the{" "}
                <strong>Attendance Rules</strong> table, find the new rule and
                click the <strong>Activate</strong> button. The Status column
                changes to <strong>Active</strong> with a green checkmark icon.
                Only one rule can be active at a time. The active rule is used
                for all attendance processing.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Edit or delete a rule if needed.</strong> Use the{" "}
                <strong>Edit</strong> icon (pencil) to change a rule's values,
                or the <strong>Delete</strong> icon (trash) to remove it. The
                active rule cannot be deleted — activate another rule first,
                then delete the old one.
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
                  Configure attendance settings <strong>before employees start
                  clocking in</strong> to ensure consistent rule application.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Only <strong>one attendance rule</strong> can be active at a
                  time. The active rule applies to all employees.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  The <strong>Web Clock In/Out</strong> toggle controls whether
                  employees see Clock In/Clock Out buttons on their dashboard.
                  When disabled, the dashboard shows:{" "}
                  <em>Web clock-in/out disabled by administrator.</em>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Changes to attendance rules apply to future attendance
                  records. Existing records are not affected.
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
                  <strong>Late threshold or grace period is negative</strong>{" "}
                  — Enter a value of 0 or higher.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Max work hours is 0 or negative</strong> — Enter a
                  value greater than 0.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Deduction value is 0 or negative</strong> — Enter a
                  deduction amount greater than 0.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot delete an active rule</strong> — Activate a
                  different rule first, then delete the old one.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Permission denied</strong> — Only users with the
                  Attendance Rules permission can manage these settings.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/attendance-settings" />
  </div>
);

export default AttendanceSettingsDocs;
