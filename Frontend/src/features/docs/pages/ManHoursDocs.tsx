import { AlertTriangle, CheckCircle2, Info, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DocsNavigation from "../components/DocsNavigation";

const manHoursAccessRows = [
  {
    action: "Open My Man Hours",
    employee: "Yes",
    assignedApprover: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
  },
  {
    action: "Submit, edit, or delete own report (pending only)",
    employee: "Yes",
    assignedApprover: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
    note: "Edit and delete buttons appear only while status is Pending",
  },
  {
    action: "View No Manhour Reports tab (missing dates)",
    employee: "Yes",
    assignedApprover: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
  },
  {
    action: "Open Approve Man Hours page",
    employee: "No",
    assignedApprover: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
    note: "Menu link appears for HR roles and employees assigned as an approver (see Settings → Approvals)",
  },
  {
    action: "Approve or reject employee reports",
    employee: "No",
    assignedApprover: "Yes, for assigned employees only",
    hr: "Yes, all employees",
    hrAdmin: "Yes, all employees",
    admin: "Yes, all employees",
  },
  {
    action: "Download reports (CSV, Excel, PDF)",
    employee: "No",
    assignedApprover: "No",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
  },
];

const ManHoursDocs = () => (
  <div className="space-y-8">
    <section id="man-hours" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Man-Hours</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            The <strong>Man-Hours</strong> module lets employees record daily
            work activities with time ranges. Approvers and HR review reports,
            then approve or reject them. This is separate from{" "}
            <strong>Attendance</strong> (check-in/check-out) and{" "}
            <strong>Overtime</strong> (extra hours requests).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Man-Hours overview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              In the sidebar, open the <strong>Man Hours</strong> menu. Everyone
              with access sees:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-1">
              <li>
                <strong>My Man Hours</strong> — submit and manage your own daily
                reports
              </li>
              <li>
                <strong>Approve Man Hours</strong> — visible only to
                Administrator, HR Admin, HR, and employees assigned as Man Hour
                approvers
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Each report covers <strong>one work date</strong>. You can add
              multiple <strong>time entries</strong> (start time, end time, and
              activity description) for that day. Total hours are calculated from
              those entries.
            </p>

            
          </div>

          <Separator />

          {/* Who can use */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Permissions &amp; access</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              UnivoHR uses these account roles: <strong>Employee</strong>,{" "}
              <strong>HR</strong>, <strong>HR Admin</strong>, and{" "}
              <strong>Administrator</strong>. There are no separate &quot;Team
              Leader&quot; or &quot;Supervisor&quot; roles in the system — a
              team lead is usually an <strong>Employee</strong> who is assigned
              as a Man Hour approver under{" "}
              <strong>Settings → Approvals</strong>.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-3 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium">Employee</th>
                    <th className="px-3 py-2 font-medium">
                      Employee (assigned approver)
                    </th>
                    <th className="px-3 py-2 font-medium">HR</th>
                    <th className="px-3 py-2 font-medium">HR Admin</th>
                    <th className="px-3 py-2 font-medium">Administrator</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {manHoursAccessRows.map((row) => (
                    <tr key={row.action} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <span className="text-foreground">{row.action}</span>
                        {row.note && (
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            {row.note}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">{row.employee}</td>
                      <td className="px-3 py-2">{row.assignedApprover}</td>
                      <td className="px-3 py-2">{row.hr}</td>
                      <td className="px-3 py-2">{row.hrAdmin}</td>
                      <td className="px-3 py-2">{row.admin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">
              Approvers assigned only for <strong>Man Hour</strong> (or{" "}
              <strong>All</strong> approval types) see reports for their assigned
              employees on the approval page. HR and administrators see all
              employees.
            </p>
          </div>

          <Separator />

          {/* Submitting */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-base">Submitting man-hours</h3>
            </div>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Go to <strong>Man Hours → My Man Hours</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                On the <strong>Man Hour Reports</strong> tab, click{" "}
                <strong>Submit Report</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Choose a <strong>Work Date</strong> (today or a past date — future
                dates are not allowed).
              </li>
              <li className="leading-relaxed pl-1">
                Add one or more <strong>time entries</strong>:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                  <li>
                    <strong>Start Time</strong> and <strong>End Time</strong>
                  </li>
                  <li>
                    <strong>Activity Description</strong> (for example: meetings,
                    development, testing)
                  </li>
                  <li>
                    Use <strong>Add Entry</strong> or{" "}
                    <strong>Add Afternoon Entry</strong> for split schedules
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Optionally add <strong>Remarks</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Review the <strong>Total</strong> hours shown on the form, then
                click <strong>Submit</strong>.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              You can submit only <strong>one report per work date</strong>. If
              a report already exists for that date, the system asks you to
              update the existing report instead of creating another.
            </p>
            <p className="text-sm text-muted-foreground">
              The form shows tips to <strong>exclude break time</strong> (for
              example, split 08:00–12:00 and 13:00–17:00 instead of one long
              08:00–17:00 block). A warning may appear if a long continuous range
              is detected.
            </p>

            
          </div>

          <Separator />

          {/* Viewing my reports */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Viewing my man-hours</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              On <strong>My Man Hours → Man Hour Reports</strong>, your submitted
              reports appear in a table with:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-1">
              <li>
                <strong>Work Date</strong>
              </li>
              <li>
                <strong>Hours</strong> (total for the day)
              </li>
              <li>
                <strong>Status</strong> — shown as <strong>Pending</strong>{" "}
                while waiting for approval, or <strong>Approved</strong> /{" "}
                <strong>Rejected</strong> after review
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Use the <strong>search box</strong> to find reports by task text.
              Use pagination at the bottom to change pages or rows per page (5,
              10, 25, or 50).
            </p>
            <p className="text-sm text-muted-foreground">
              Click the <strong>eye icon</strong> to open the details panel
              (drawer) on the right with full time entries, remarks, status, and
              approval history.
            </p>
          </div>

          <Separator />

          {/* Editing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Editing man-hours</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Find a report with status <strong>Pending</strong> in your table.
              </li>
              <li className="leading-relaxed pl-1">
                Click the <strong>pencil (edit)</strong> icon.
              </li>
              <li className="leading-relaxed pl-1">
                Update time entries and remarks. The work date cannot be changed
                while editing.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Update</strong>.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              You cannot edit a report that is already <strong>Approved</strong>.
              Edit and delete actions are not shown in the table after a report
              is approved or rejected.
            </p>
          </div>

          <Separator />

          {/* Deleting */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Deleting man-hours</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For <strong>Pending</strong> reports only, click the{" "}
              <strong>trash</strong> icon, confirm in the dialog, and the report
              is removed. Approved reports cannot be deleted from My Man Hours.
            </p>
          </div>

          <Separator />

          {/* Missing tab */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">
              No Manhour Reports tab (missing dates)
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The second tab, <strong>No Manhour Reports</strong>, helps you see
              dates in a range where you have not submitted a report yet.
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Set <strong>Start Date</strong> and <strong>End Date</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                The list updates automatically, or click <strong>Refresh</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Missing dates appear as cards labeled <strong>No report</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                If every day in the range has a report, you will see a message
                that no missing reports were found.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              This tab is for your own records only — it does not submit a report
              for you. Use <strong>Submit Report</strong> on the other tab for
              each date you need to file.
            </p>
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Status tracking</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-2">
              <li>
                <strong>Pending</strong> — submitted and waiting for an approver
                (stored internally as Submitted)
              </li>
              <li>
                <strong>Approved</strong> — an approver accepted the report
              </li>
              <li>
                <strong>Rejected</strong> — an approver declined the report; the
                rejection reason appears in the details panel under Approval
                Timeline
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Open report details to see the full <strong>Approval Timeline</strong>{" "}
              (submitted, approved, or rejected) with who acted and when.
            </p>

            
          </div>

          <Separator />

          {/* Approval process */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Approval process</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Open <strong>Man Hours → Approve Man Hours</strong> to review team
              submissions.
            </p>

            

            <p className="text-sm font-medium text-foreground">
              Reviewing employee man-hours
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Use <strong>search</strong> (employee name, employee code, or
                task text) and optional <strong>date filter</strong> to narrow the
                list.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Clear Filters</strong> or <strong>Refresh</strong>{" "}
                to reset the view.
              </li>
              <li className="leading-relaxed pl-1">
                Click the <strong>eye icon</strong> to read full time entries and
                history before deciding.
              </li>
              <li className="leading-relaxed pl-1">
                For <strong>Pending</strong> rows, use the green check to{" "}
                <strong>Approve</strong> or the red X to <strong>Reject</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                When rejecting, enter a <strong>reason</strong> in the dialog
                (required), then confirm.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              After approval or rejection, the Approval column shows{" "}
              <strong>Processed</strong> and approve/reject buttons are no longer
              available for that row.
            </p>
            <p className="text-sm text-muted-foreground">
              Approvers cannot approve or reject their <strong>own</strong> man-hour
              reports.
            </p>
          </div>

          <Separator />

          {/* Downloads */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Reports &amp; downloads</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              On the approval page, <strong>Download Report</strong> is available
              to <strong>Administrator</strong>, <strong>HR Admin</strong>, and{" "}
              <strong>HR</strong> only (not assigned employee-approvers).
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Click <strong>Download Report</strong> and choose{" "}
                <strong>CSV</strong>, <strong>Excel</strong>, or <strong>PDF</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                In the dialog, set <strong>Start Date</strong> and{" "}
                <strong>End Date</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Optionally enter an <strong>Employee ID</strong> to limit the
                export to one person (leave blank for all employees).
              </li>
              <li className="leading-relaxed pl-1">
                Confirm the format and click <strong>Download</strong>. The file
                saves to your device.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Exports include summary and detailed man-hour information for the
              selected period. There is no charts or analytics screen in the
              Man-Hours module.
            </p>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-base">Notifications &amp; email</h3>
            </div>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-2">
              <li>
                When you submit a report, approvers (HR roles and assigned
                approvers) may receive an in-app notification titled{" "}
                <strong>New Man Hour Report</strong>.
              </li>
              <li>
                When your report is approved or rejected, you may receive an
                in-app notification. Clicking it opens <strong>My Man Hours</strong>.
              </li>
              <li>
                Email messages for man-hour approval or rejection are sent only
                if enabled under <strong>Settings → Notifications</strong>{" "}
                (notify when man hour approved / rejected).
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Who approves your reports is configured under{" "}
              <strong>Settings → Approvals</strong> with approval type{" "}
              <strong>Man Hour</strong> or <strong>All</strong>.
            </p>
          </div>

          <Separator />

          {/* Related modules */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                How man-hours relate to other modules
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Attendance</strong> records check-in and check-out times.
                  Man-hours are a separate daily activity log and do not replace
                  attendance records.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Overtime</strong> is a different request type with its
                  own submit and approval pages.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Payroll</strong> in this application does not show a
                  direct link to man-hour totals on payslips. Man-hours support
                  tracking and management reporting; confirm with your HR team
                  how approved hours are used in your company&apos;s payroll
                  process.
                </span>
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                Man-hours troubleshooting
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Please select a work date</strong> — Choose a date
                  before submitting.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Please fill in all time entry fields</strong> — Every
                  entry needs start time, end time, and activity.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>End time must be after start time</strong> — Adjust
                  times for each activity.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Man hour report already exists for this date</strong> —
                  Use edit on your existing pending report instead of submitting
                  again.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot submit for future dates</strong> — Work date must
                  be today or earlier.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot update an approved man hour report</strong> —
                  Contact HR if an approved report needs correction.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Please provide a reason for rejection</strong> —
                  Approvers must enter text before confirming rejection.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>No Approve Man Hours menu</strong> — Only HR roles and
                  employees assigned as Man Hour approvers see this link.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Redirected to My Man Hours</strong> — If you open the
                  approval URL without permission, the app sends you to your own
                  reports page.
                </span>
              </li>
            </ul>
          </div>

          {/* Needs confirmation */}
          <div className="p-4 rounded-lg border border-dashed border-muted-foreground/40 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Needs confirmation</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                <span>
                  After a report is <strong>Rejected</strong>, the edit button is
                  hidden in My Man Hours even though only approved reports are
                  blocked from updates on the server. Confirm with your HR team
                  how you should correct and resubmit a rejected report.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                <span>
                  The <strong>No Manhour Reports</strong> tab shows Start Date and
                  End Date fields; confirm with your administrator whether both
                  dates define the range exactly as you expect.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                <span>
                  Whether your organization uses approved man-hour totals in
                  payroll, billing, or client reporting outside this screen.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/man-hours" />
  </div>
);

export default ManHoursDocs;
