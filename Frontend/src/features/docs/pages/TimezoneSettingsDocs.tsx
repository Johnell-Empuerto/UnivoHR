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

const TimezoneSettingsDocs = () => (
  <div className="space-y-8">
    <section id="timezone-settings" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Timezone Settings Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to configure timezone settings in UnivoHR. The correct
            timezone is essential — attendance clock-in/out times, shift
            schedules, overtime calculations, payroll cutoffs, and reports all
            depend on the right timezone.
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
              <Badge variant="outline">Before attendance setup</Badge>
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
                  <strong>After Employee Code Settings</strong> — configure
                  timezone before setting up attendance rules and shifts.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Before employees begin clocking in/out</strong> — a
                  wrong timezone will record incorrect times.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>When a branch operates in a different timezone</strong>{" "}
                  — set the correct timezone for each branch location.
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
                  Successfully logged in and finished Employee Code Settings
                  (see <strong>Employee Code Settings Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Created branches (see <strong>Branch Setup Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Know the correct timezone for your company and each branch
                  location
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Setting the company default timezone
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              The company default timezone is used as a fallback when a branch
              or employee has no timezone assigned. Follow these steps:
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open System Settings.</strong> From the sidebar menu on
                the left, click <strong>Settings</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Timezone tab.</strong> Below the page heading,
                click the <strong>Timezone</strong> tab. The{" "}
                <strong>Company Default Timezone</strong> card appears with a
                description: <em>Sets the fallback timezone used when a branch
                or employee has no timezone assigned</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the correct timezone.</strong> Click the{" "}
                <strong>Timezone</strong> dropdown and choose the timezone that
                matches your company's primary operating location. The available
                options are:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li><span className="font-mono">Asia/Manila</span></li>
                  <li><span className="font-mono">Asia/Tokyo</span></li>
                  <li><span className="font-mono">Asia/Singapore</span></li>
                  <li><span className="font-mono">Asia/Kuala_Lumpur</span></li>
                  <li><span className="font-mono">Asia/Hong_Kong</span></li>
                  <li><span className="font-mono">Asia/Seoul</span></li>
                  <li><span className="font-mono">Asia/Dubai</span></li>
                  <li><span className="font-mono">UTC</span></li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>The timezone saves automatically.</strong> As soon as
                you select a timezone from the dropdown, the system saves it
                immediately. A brief <strong>Saving...</strong> indicator
                appears, followed by a green message saying{" "}
                <strong>Company timezone updated to Asia/Manila</strong> (or
                whichever timezone you selected). There is no separate Save
                button.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Confirm the timezone was set.</strong> The Timezone
                dropdown should now show your selected value. The fallback order
                is: Device branch timezone → Employee branch timezone → Company
                default timezone → Asia/Manila.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Setting a branch-specific timezone
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Each branch can have its own timezone. This overrides the company
              default for employees assigned to that branch.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open the Branches page.</strong> From the sidebar,
                click <strong>Branches</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Find the branch and click Edit.</strong> In the branch
                list, click the <strong>Edit</strong> icon (pencil) next to the
                branch you want to update. The <strong>Edit Branch</strong>{" "}
                dialog opens.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the timezone.</strong> Click the{" "}
                <strong>Timezone</strong> dropdown and choose the correct
                timezone for that branch. The same timezone options are
                available as in the company settings.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Save Changes.</strong> Click the{" "}
                <strong>Save Changes</strong> button. A green message says{" "}
                <strong>Branch updated</strong>. The branch's timezone now
                overrides the company default for employees assigned here.
              </li>
            </ol>
          </div>

          <Separator />

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                How timezone affects the system
              </h3>
            </div>
            <ul className="space-y-1 text-sm text-blue-800/90 dark:text-blue-300/90">
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Attendance records</strong> — clock-in and clock-out
                  times are recorded based on the timezone of the device or
                  employee's branch.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Shift schedules</strong> — shift start and end times
                  are interpreted using the branch or company timezone.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Overtime and late calculations</strong> — late
                  minutes and overtime hours are calculated based on the
                  correct timezone.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Payroll cutoffs</strong> — payroll periods use the
                  timezone to determine cutoff dates correctly.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If timezone setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Wrong timezone selected</strong> — Go back to the
                  Timezone tab or the branch Edit dialog and select the correct
                  timezone. The change saves automatically in the Settings
                  tab.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Timezone did not save</strong> — In the Settings tab,
                  timezone saves automatically when you select one. For a
                  branch, make sure you clicked{" "}
                  <strong>Save Changes</strong>. Refresh if needed.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Permission denied</strong> — Only users with the
                  System Settings permission can update the company timezone.
                  Only users with Manage Branches permission can update branch
                  timezones.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/timezone-settings" />
  </div>
);

export default TimezoneSettingsDocs;
