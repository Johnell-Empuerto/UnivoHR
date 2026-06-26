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

const ShiftSettingsDocs = () => (
  <div className="space-y-8">
    <section id="shift-settings" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Shift Settings Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to create and manage work shifts in UnivoHR. Shifts
            define employee work schedules — including start and end times,
            break periods, grace minutes, and shift type. Attendance, late
            detection, night differential, and payroll all depend on correct
            shift settings.
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
              <Badge variant="outline">Before employee shift assignment</Badge>
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
                  <strong>After Attendance Settings</strong> — create shifts
                  before assigning schedules to employees.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Before employees start clocking in/out</strong> — the
                  system uses shift times to determine lateness, overtime, and
                  attendance status.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>When the company adds a new work schedule</strong> —
                  create a new shift record for each unique schedule (e.g.,
                  morning, mid, night, flexitime).
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
                  Successfully logged in and finished attendance settings (see{" "}
                  <strong>Attendance Settings Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Decided your shift schedules — name, start/end times, break
                  periods, and shift type for each schedule
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Prepared a short code for each shift (e.g.,{" "}
                  <span className="font-mono">MORNING</span>,{" "}
                  <span className="font-mono">NIGHT</span>)
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
                the left, click <strong>Settings</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Shifts tab.</strong> Click the{" "}
                <strong>Shifts</strong> tab. The{" "}
                <strong>Shift Schedules</strong> card appears showing a list
                of existing shifts and an <strong>Add Shift</strong> button.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Shift.</strong> Click the{" "}
                <strong>Add Shift</strong> button. A dialog box titled{" "}
                <strong>Create Shift</strong> opens.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the Shift Name.</strong> Click the{" "}
                <strong>Shift Name</strong> field and type the shift name
                (e.g., <span className="font-mono">Morning Shift</span>). This
                field is required.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the Code (optional).</strong> Click the{" "}
                <strong>Code</strong> field and type a short identifier (e.g.,{" "}
                <span className="font-mono">MORNING</span>).
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the Shift Type.</strong> Click the{" "}
                <strong>Type</strong> dropdown and choose one:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Morning</strong> — standard daytime shift
                  </li>
                  <li>
                    <strong>Mid</strong> — mid-day shift
                  </li>
                  <li>
                    <strong>Night</strong> — overnight shift (enables night
                    differential handling)
                  </li>
                  <li>
                    <strong>Flexitime</strong> — flexible working hours
                    (additional Flexitime Windows fields appear)
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set the Start Time and End Time.</strong> Click the{" "}
                <strong>Start Time</strong> and <strong>End Time</strong>{" "}
                fields and set the shift's schedule using the time picker
                (e.g., <span className="font-mono">08:00</span> to{" "}
                <span className="font-mono">17:00</span>). Both fields are
                required.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set Break Start and Break End (optional).</strong> Use
                the time pickers to set the lunch or rest break period (e.g.,{" "}
                <span className="font-mono">12:00</span> to{" "}
                <span className="font-mono">13:00</span>).
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set Grace Minutes.</strong> Enter the number of minutes
                employees can be late before being penalized (e.g.,{" "}
                <span className="font-mono">0</span>). Range is 0 to 120.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set Required Hours.</strong> Enter the number of hours
                employees must work per shift (e.g.,{" "}
                <span className="font-mono">8</span> or{" "}
                <span className="font-mono">8.5</span>). Range is 1 to 24.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>If Flexitime, configure the windows.</strong> If you
                selected <strong>Flexitime</strong> as the type, two additional
                time fields appear under{" "}
                <strong>Flexitime Windows</strong>: set{" "}
                <strong>Flex Start Window</strong> and{" "}
                <strong>Flex End Window</strong> to define the range within
                which employees can flex their schedule.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Add a Description (optional).</strong> Click the{" "}
                <strong>Description</strong> field and type any notes about the
                shift.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set the Active status.</strong> Use the{" "}
                <strong>Active</strong> toggle. When ON, the shift can be
                assigned to employees.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Create.</strong> Click the{" "}
                <strong>Create</strong> button. The button changes to{" "}
                <strong>Saving...</strong> while the system saves. A green
                message says <strong>Shift created</strong>. The new shift
                appears in the shift list table.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">How to edit a shift</h3>
            </div>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                In the shift list, click the <strong>Edit</strong> icon
                (pencil) next to the shift.
              </li>
              <li className="leading-relaxed pl-1">
                The dialog opens with the title{" "}
                <strong>Edit Shift</strong> and all fields filled with the
                current values.
              </li>
              <li className="leading-relaxed pl-1">
                Change the fields you want to update and click{" "}
                <strong>Update</strong>. A green message says{" "}
                <strong>Shift updated</strong>.
              </li>
            </ol>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">How to delete a shift</h3>
            </div>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                In the shift list, click the <strong>Delete</strong> icon
                (trash) next to the shift.
              </li>
              <li className="leading-relaxed pl-1">
                A confirmation dialog appears:{" "}
                <em>Delete shift "Shift Name"?</em>
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>OK</strong> to confirm. A green message says{" "}
                <strong>Shift deleted</strong>.
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
                  <strong>Create shifts before assigning employees.</strong>{" "}
                  The employee creation form includes a Shift Assignment
                  dropdown that lists all active shifts.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  The <strong>Type</strong> dropdown determines whether a shift
                  is treated as a night shift (for night differential) or
                  flexitime.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Only <strong>active</strong> shifts can be assigned to
                  employees. Toggle a shift to inactive to prevent new
                  assignments while keeping existing ones.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Avoid changing shift times <strong>after attendance records
                  already exist</strong> for the affected period.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If shift setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Shift name is missing</strong> — Enter a shift name.
                  This field is required.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Start or end time is missing</strong> — Both start
                  and end times are required.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Permission denied</strong> — Only users with the
                  Attendance Rules permission can manage shifts.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Changes did not appear</strong> — Refresh the page or
                  reopen the Shifts tab to see the latest data.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/shift-settings" />
  </div>
);

export default ShiftSettingsDocs;
