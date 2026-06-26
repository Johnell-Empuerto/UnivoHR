import { CheckCircle2, Info, Users } from "lucide-react";
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

const EmployeeShiftAssignmentDocs = () => (
  <div className="space-y-8">
    <section id="employee-shift-assignment" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Employee Shift / Rest Day / Rotation Assignment Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to assign employees to their work shifts, rest day
            overrides, and rotation groups in UnivoHR. Proper assignments
            ensure attendance tracking and payroll calculations use the
            correct schedule for each employee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">HR Admin</Badge>
              <Badge variant="outline">After salary setup</Badge>
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
                  <strong>After creating an employee</strong> — assign a
                  shift and configure rest day overrides in the employee
                  record.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Schedule changes</strong> — update an employee's
                  shift or rest day overrides.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Rotation setup</strong> — assign employees to
                  rotation groups for rotating shift schedules.
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Assigning a shift in the employee record
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open Employees.</strong> From the sidebar, click{" "}
                <strong>Employees</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Find the employee.</strong> Use the search field or
                browse the table, then click the <strong>Edit</strong> icon.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Scroll to System Information.</strong> In the
                employee drawer, find the{" "}
                <strong>System Information</strong> section.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select a shift.</strong> Open the{" "}
                <strong>Shift Assignment</strong> dropdown. The default is{" "}
                <strong>Default (8AM-5PM)</strong>. Choose from the available
                shift schedules you configured in Settings.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save the employee record.</strong> Scroll down and
                click <strong>Save</strong>. The shift is now assigned to
                this employee.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding rest day overrides
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Rest day overrides let you set individual rest days for an
              employee that differ from their branch's default rest days.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                In the same employee drawer, find the{" "}
                <strong>Rest Day Overrides</strong> section. The employee's
                branch default rest days are shown under{" "}
                <strong>Branch Default Rest Days</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Click the <strong>+ Add</strong> button.
              </li>
              <li className="leading-relaxed pl-1">
                Select a day from the dropdown (default:{" "}
                <strong>Select day...</strong>). The rest day appears as a
                blue badge.
              </li>
              <li className="leading-relaxed pl-1">
                To remove an override, click the <strong>×</strong> button on
                the badge.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Assigning an employee to a rotation group
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open Settings.</strong> From the sidebar, click{" "}
                <strong>Settings</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Scroll down and click the{" "}
                <strong>Employee Rotation</strong> tab. The{" "}
                <strong>Employee Rotation</strong> card shows a searchable
                employee list with columns: Code, Name, Department, Position,
                Status.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Search for the employee.</strong> Type the employee
                name or code in the search field.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the employee.</strong> Click on the employee
                row. A detail panel opens showing their current rotation
                group (if any) and assignment history.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Assign to Group.</strong> The{" "}
                <strong>Assign Name to Rotation Group</strong> dialog opens.
              </li>
              <li className="leading-relaxed pl-1">
                Select a <strong>Rotation Group</strong> from the dropdown
                (showing group name and member count).
              </li>
              <li className="leading-relaxed pl-1">
                Set the <strong>Start Date</strong> for the assignment.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Assign</strong>. A green message says{" "}
                <strong>Employee assigned to rotation group</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                To end a rotation, click <strong>End Rotation</strong>. A
                confirmation dialog appears. Click <strong>End Rotation</strong>{" "}
                again to confirm.
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
                  <strong>Shift assignment is per employee:</strong> Each
                  employee can have one active shift assignment. The default
                  is 8AM-5PM if no shift is selected.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Rest day overrides are optional:</strong> If no
                  overrides are set, the employee follows their branch's
                  default rest days.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Rotation groups need pre-configuration:</strong>{" "}
                  Groups, patterns, and pattern assignments must be set up
                  first in Settings before assigning employees.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>View assignment history:</strong> The Employee
                  Rotation panel shows the employee's full rotation
                  assignment history with start and end dates.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/employee-shift-assignment" />
  </div>
);

export default EmployeeShiftAssignmentDocs;
