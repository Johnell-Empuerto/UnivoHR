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
import DocScreenshot from "../components/DocScreenshot";
import DocsNavigation from "../components/DocsNavigation";

const overtimeAccessRows = [
  {
    action: "Open My Overtime",
    employee: "Yes",
    assignedApprover: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
  },
  {
    action: "Submit overtime request (Apply Overtime)",
    employee: "Yes",
    assignedApprover: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
  },
  {
    action: "Edit or cancel a submitted request",
    employee: "No",
    assignedApprover: "No",
    hr: "No",
    hrAdmin: "No",
    admin: "No",
    note: "Not available in the app after submission",
  },
  {
    action: "Open Manage Overtime (approval queue)",
    employee: "No",
    assignedApprover: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
    note: "Sidebar label is Manage Overtime; page title is Overtime Requests",
  },
  {
    action: "Approve or reject employee requests",
    employee: "No",
    assignedApprover: "Yes, assigned employees only",
    hr: "Yes, all employees",
    hrAdmin: "Yes, all employees",
    admin: "Yes, all employees",
  },
  {
    action: "Download or export overtime reports",
    employee: "No",
    assignedApprover: "No",
    hr: "No",
    hrAdmin: "No",
    admin: "No",
    note: "No export feature on overtime screens",
  },
];

const OvertimeDocs = () => (
  <div className="space-y-8">
    <section id="overtime" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Overtime</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            The <strong>Overtime</strong> module lets employees request extra
            hours worked on a specific date. Approvers and HR review requests,
            then approve or reject them. Approved overtime may be included when
            payroll is processed. This is separate from{" "}
            <strong>Attendance</strong> (daily check-in/out) and{" "}
            <strong>Man-Hours</strong> (daily activity reports).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Overtime overview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              In the sidebar, open the <strong>Overtime</strong> menu:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-1">
              <li>
                <strong>My Overtime</strong> — submit and track your own
                requests
              </li>
              <li>
                <strong>Manage Overtime</strong> — review team requests (visible
                to Administrator, HR Admin, HR, and employees assigned as
                overtime approvers)
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Each request includes a <strong>date</strong>,{" "}
              <strong>start time</strong>, <strong>end time</strong>, calculated{" "}
              <strong>hours</strong>, and a <strong>reason</strong>. Hours are
              calculated from the times you enter when you submit.
            </p>

            <DocScreenshot
              src="/docs/screenshots/overtime-overview.png"
              alt="Overtime overview page with My Overtime list and filters"
            />
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Permissions &amp; access</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              UnivoHR uses these account roles: <strong>Employee</strong>,{" "}
              <strong>HR</strong>, <strong>HR Admin</strong>, and{" "}
              <strong>Administrator</strong>. Team leads or supervisors are
              typically <strong>Employees</strong> assigned as approvers under{" "}
              <strong>Settings → Approvals</strong> with approval type{" "}
              <strong>Overtime</strong> (or <strong>All</strong>).
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
                  {overtimeAccessRows.map((row) => (
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
          </div>

          <Separator />

          {/* Submitting */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-base">
                Submitting overtime requests
              </h3>
            </div>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Go to <strong>Overtime → My Overtime</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Apply Overtime</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Select the <strong>Date</strong> using the calendar picker.
              </li>
              <li className="leading-relaxed pl-1">
                Enter <strong>Start Time</strong> and <strong>End Time</strong>.
                The form shows <strong>Total Overtime Hours</strong> as you type.
              </li>
              <li className="leading-relaxed pl-1">
                Enter a <strong>Reason</strong> describing why overtime was
                worked.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Submit Overtime Request</strong>.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              The form checks that all required fields are filled, end time is
              after start time, and overtime does not exceed{" "}
              <strong>12 hours</strong> for one request.
            </p>

            <DocScreenshot
              src="/docs/screenshots/overtime-request-form.png"
              alt="Overtime request form with date, times, and reason"
            />
          </div>

          <Separator />

          {/* Viewing my overtime */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Viewing my overtime</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your requests appear in a table with date, start time, end time,
              hours, and status. Use the table as your overtime history for
              requests you have submitted.
            </p>
            <p className="text-sm text-muted-foreground">
              Click the <strong>eye icon</strong> to open the details panel with
              full request information, approval details (when applicable), and
              submission time.
            </p>

            <DocScreenshot
              src="/docs/screenshots/overtime-details.png"
              alt="Overtime details view in side panel"
            />
          </div>

          <Separator />

          {/* Editing / cancelling */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">
              Editing or cancelling requests
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              After you submit a request, there is <strong>no edit, cancel, or
              delete button</strong> on My Overtime. If you need to change a
              pending request, contact your approver or HR. If a request was
              rejected, submit a new request only if your HR team allows it for
              the same situation.
            </p>
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Status tracking</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-2">
              <li>
                <strong>PENDING</strong> — submitted and waiting for review
              </li>
              <li>
                <strong>APPROVED</strong> — accepted; details show who approved
                and when
              </li>
              <li>
                <strong>REJECTED</strong> — declined; details show the rejection
                reason
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              On My Overtime, filter by status using the{" "}
              <strong>All Status</strong> dropdown (Pending, Approved, or
              Rejected).
            </p>
          </div>

          <Separator />

          {/* Filters */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Filters &amp; search</h3>
            <p className="text-sm font-medium text-foreground">My Overtime</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-1">
              <li>
                <strong>Search</strong> — filters by text in your reason field
              </li>
              <li>
                <strong>Status</strong> — All, Pending, Approved, or Rejected
              </li>
              <li>
                <strong>Clear Filters</strong> and <strong>Refresh</strong> reset
                the view
              </li>
            </ul>
            <p className="text-sm font-medium text-foreground mt-4">
              Manage Overtime (approval page)
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-1">
              <li>
                <strong>Search</strong> — employee first name, last name, or
                employee code
              </li>
              <li>
                <strong>Status</strong> — same options as My Overtime
              </li>
              <li>
                <strong>Date</strong> — show requests for one specific work date
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Both pages support pagination and rows per page (5, 10, 25, or
              50).
            </p>
          </div>

          <Separator />

          {/* Approval */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Approval process</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Open <strong>Overtime → Manage Overtime</strong> to review team
              requests. There is a <strong>single-step</strong> approve or reject
              action — no multi-level approval chain in the app.
            </p>

            <DocScreenshot
              src="/docs/screenshots/overtime-approval.png"
              alt="Overtime approval page with employee table and filters"
            />

            <p className="text-sm font-medium text-foreground">
              Reviewing employee overtime
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Use search, status, and date filters to find requests.
              </li>
              <li className="leading-relaxed pl-1">
                Click the <strong>eye icon</strong> to read the full reason and
                times before deciding.
              </li>
              <li className="leading-relaxed pl-1">
                For <strong>PENDING</strong> rows, click the green check to{" "}
                <strong>approve</strong> or the red X to <strong>reject</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                When rejecting, enter a <strong>reason</strong> in the dialog
                (required), then confirm.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Assigned employee-approvers only see requests for employees they are
              mapped to. HR and administrators see all employees. You cannot
              approve or reject your own request.
            </p>
            <p className="text-sm text-muted-foreground">
              If you lack permission for a specific row, you may see an error
              message: &quot;You don&apos;t have permission to approve/reject
              this request.&quot;
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
                When you submit a request, HR roles and your assigned overtime
                approvers may receive an in-app notification titled{" "}
                <strong>New Overtime Request</strong>.
              </li>
              <li>
                When your request is approved or declined, you may receive an
                in-app notification. Clicking it opens <strong>My Overtime</strong>.
              </li>
              <li>
                Email messages for overtime approval or rejection are sent only
                if enabled under <strong>Settings → Notifications</strong>.
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Approver assignments are managed under{" "}
              <strong>Settings → Approvals</strong> (approval type Overtime or
              All).
            </p>
          </div>

          <Separator />

          {/* Related modules */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                How overtime relates to other modules
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Attendance</strong> records check-in and check-out.
                  Overtime is a separate request you file for extra hours beyond
                  your normal schedule.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Payroll</strong> — when HR runs payroll for a period,
                  <strong>approved</strong> overtime that has not yet been paid
                  in that date range can be counted. Pay uses each employee&apos;s{" "}
                  <strong>overtime rate</strong> from Payroll → Settings (Employee
                  Salary Settings). After payroll is processed, those overtime
                  records are marked as paid in the system. Employees do not
                  approve their own payroll from the Overtime screens.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Man-Hours</strong> — daily activity reports; not the
                  same as overtime requests.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  The system does <strong>not</strong> automatically detect
                  overtime from attendance clock times. You must submit an
                  overtime request with your own start and end times.
                </span>
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                Overtime troubleshooting
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Date / Start time / End time / Reason is required</strong>{" "}
                  — Complete all fields before submitting.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>End time must be after start time</strong> — Adjust your
                  times so total hours are greater than zero.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Overtime cannot exceed 12 hours</strong> — Split into
                  separate requests or correct your times if needed.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot submit overtime for future dates</strong> — Use
                  today or a past date only.
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
                  <strong>You cannot approve your own overtime request</strong>{" "}
                  — Another approver or HR must process it.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot approve already paid overtime request</strong>{" "}
                  — Shown if payroll has already marked the request as paid.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>No Manage Overtime menu</strong> — Only HR roles and
                  users assigned as approvers see this link.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Redirected to My Overtime</strong> — Opening the
                  approval page without permission sends you to your own requests.
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
                  Whether approvers assigned with approval type <strong>All</strong>{" "}
                  (but not Overtime) always appear in the Manage Overtime queue —
                  the approval list filter uses Overtime-type mappings for
                  employee-approvers.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                <span>
                  Company rules for overlapping overtime requests on the same date
                  (the app does not block duplicate dates in the submission form).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                <span>
                  Exact overtime pay rules (multipliers, caps, or holiday rates)
                  beyond the employee overtime rate used in payroll generation.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/overtime" />
  </div>
);

export default OvertimeDocs;
