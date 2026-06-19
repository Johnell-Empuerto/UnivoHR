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

const ApprovalSettingsDocs = () => (
  <div className="space-y-8">
    <section id="approval-settings" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Approval Settings Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to set up approver mappings in UnivoHR. Approval
            Settings define which employee (the approver) can approve requests
            for another employee. This is required for overtime, leave, and
            man hour submissions to go through the correct approval chain.
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
              <Badge variant="outline">After payroll rules</Badge>
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
                  <strong>First-time setup</strong> — after configuring pay
                  rules and payroll rules, set up who approves requests.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>New employees join</strong> — assign approvers so
                  they can submit leave, overtime, and man hour requests.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Reorganization</strong> — when managers change or
                  teams restructure, update the approver mappings.
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
                  Completed <strong>Payroll Rules Guide</strong> and previous
                  Phase 2 setup
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  A list of which employees need which approval types
                  (Overtime, Leave, Man Hour) and who their approver is
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  The <strong>settings.approvals</strong> permission to access
                  the Approvals tab
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding an approver mapping
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open System Settings.</strong> From the sidebar menu,
                click <strong>Settings</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Approvals tab.</strong> Click the{" "}
                <strong>Approvals</strong> tab. The{" "}
                <strong>Employee Approver Mappings</strong> card appears.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Approver.</strong> Click the{" "}
                <strong>Add Approver</strong> button at the top of the card.
                The <strong>Add Approver Mapping</strong> dialog opens with
                the description:{" "}
                <em>Assign an approver to an employee for overtime, leave, or
                man hour requests</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the employee.</strong> Click the{" "}
                <strong>Select employee</strong> button. The{" "}
                <strong>Select Employee</strong> dialog opens. Search for and
                select the employee who will be submitting requests.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the approver.</strong> Click the{" "}
                <strong>Select approver</strong> button. The{" "}
                <strong>Select Approver</strong> dialog opens. Search for and
                select the person who will approve this employee's requests.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Choose the approval type.</strong> Open the{" "}
                <strong>Approval Type</strong> dropdown and choose one of:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Overtime</strong> — for overtime requests
                  </li>
                  <li>
                    <strong>Leave</strong> — for leave requests
                  </li>
                  <li>
                    <strong>Man Hour</strong> — for man hour reports
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save the mapping.</strong> Click the{" "}
                <strong>Create</strong> button. A green message says{" "}
                <strong>Approver mapping created successfully</strong>. The
                new mapping appears in the table showing Employee, Employee
                Code, Approver, Approver Code, Approval Type (with a colored
                badge), and Created At.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing existing mappings
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Search by keyword.</strong> Use the{" "}
                <strong>Search by employee or approver...</strong> field to
                filter the table by name.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Filter by type.</strong> Open the{" "}
                <strong>All Types</strong> dropdown to show only Overtime,
                Leave, or Man Hour mappings.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Clear filters.</strong> Click{" "}
                <strong>Clear Filters</strong> to reset the search and type
                filter.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Edit a mapping.</strong> Click the{" "}
                <strong>Edit</strong> icon in the Actions column. The{" "}
                <strong>Edit Approver Mapping</strong> dialog opens. Change
                the approver, approval type, or employee as needed, then click{" "}
                <strong>Update</strong>. A green message says{" "}
                <strong>Approver mapping updated successfully</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Delete a mapping.</strong> Click the{" "}
                <strong>Delete</strong> icon. A confirmation prompt says{" "}
                <em>Are you sure you want to remove this approver mapping?</em>
                . Click OK to confirm. A green message says{" "}
                <strong>Approver mapping removed successfully</strong>.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Understanding approval types
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="list-disc">
                <strong>Overtime</strong> — Employees submit overtime requests
                for approval. The approver reviews and approves or rejects
                the overtime before it is included in payroll.
              </li>
              <li className="list-disc">
                <strong>Leave</strong> — Employees submit leave requests. The
                approver approves or rejects the leave, which then updates
                the attendance and payroll calculations.
              </li>
              <li className="list-disc">
                <strong>Man Hour</strong> — Employees submit man hour reports
                for work done. The approver reviews and approves the hours
                before they are processed.
              </li>
            </ul>
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
                  <strong>Employee and approver must be different:</strong> An
                  employee cannot approve their own requests. You will see a
                  validation error if you select the same person.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Separate mapping per type:</strong> If an employee
                  needs approval for both Overtime and Leave, you need two
                  separate mappings (one for each type).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>The same person can approver multiple employees:</strong>{" "}
                  One manager can be the approver for many team members.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Leave Approvers separate page:</strong> There is
                  also a dedicated Leave Approval Settings page for managing
                  leave-specific approvers only.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If approver setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Approvals tab not visible</strong> — Your account
                  may not have the{" "}
                  <strong>settings.approvals</strong> permission.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Employee and approver cannot be the same person</strong>{" "}
                  — Select two different people.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Please select both employee and approver</strong> —
                  Make sure both fields are filled before clicking Create.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/approval-settings" />
  </div>
);

export default ApprovalSettingsDocs;
