import { AlertTriangle, CheckCircle2, Info, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DocScreenshot from "../components/DocScreenshot";
import DocsNavigation from "../components/DocsNavigation";

const leaveAccessRows = [
  {
    action: "Open Leaves (My Leaves / Manage Leaves)",
    employee: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Administrator screen",
  },
  {
    action: "Submit leave request",
    employee: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes (own account)",
  },
  {
    action: "View My Leaves tab",
    employee: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Via Leave Requests tab",
  },
  {
    action: "View All Leaves / approve team requests",
    employee: "If assigned approver",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
  },
  {
    action: "View Leave Credits (own balance)",
    employee: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
  },
  {
    action: "Edit all employees' leave credits",
    employee: "No",
    hr: "No",
    hrAdmin: "Yes",
    admin: "Yes",
  },
  {
    action: "Conversion Settings / Conversion History",
    employee: "No",
    hr: "No",
    hrAdmin: "No",
    admin: "Yes",
  },
];

const LeavesDocs = () => (
  <div className="space-y-8">
    <section id="leaves" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Leave management</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Request time off, track approval status, and view leave balances.
            HR staff and assigned approvers can review requests. Administrators
            have an expanded leave area for company-wide requests, credits, and
            leave conversion tools.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Leave overview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Open <strong>My Leaves</strong> or <strong>Manage Leaves</strong>{" "}
              from the sidebar (the label depends on your role).
            </p>

            <p className="text-sm font-medium text-foreground">
              Most users (Employee, HR, HR Admin)
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 mb-3">
              <li>
                <strong>My Leaves</strong> — your requests and submit new leave
              </li>
              <li>
                <strong>All Leaves</strong> — visible if you are HR, HR Admin, or
                an assigned leave approver
              </li>
              <li>
                <strong>Leave Credits</strong> — your balances and leave history
              </li>
            </ul>

            <p className="text-sm font-medium text-foreground">
              Administrator only
            </p>
            <p className="text-sm text-muted-foreground">
              Administrators see a dedicated screen with tabs:{" "}
              <strong>Leave Requests</strong>,{" "}
              <strong>Conversion History</strong>,{" "}
              <strong>Conversion Settings</strong>, and{" "}
              <strong>Leave Credits</strong> (all employees).
            </p>

            <p className="text-sm text-muted-foreground">
              Leave types in the system: <strong>Sick Leave</strong>,{" "}
              <strong>Vacation Leave</strong>, <strong>Maternity Leave</strong>,{" "}
              <strong>Emergency Leave</strong>, and <strong>No Pay Leave</strong>{" "}
              (unpaid; no balance limit).
            </p>

            <DocScreenshot
              src="/docs/screenshots/leaves-overview.png"
              alt="Leave management page overview"
            />
          </div>

          <Separator />

          {/* Submit */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-base">Submitting a leave request</h3>
            </div>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Go to <strong>My Leaves</strong> and click{" "}
                <strong>Request Leave</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Your name and employee code are filled in automatically (employees
                cannot change these).
              </li>
              <li className="leading-relaxed pl-1">
                Choose <strong>Leave Type</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Choose <strong>Leave Duration</strong>: Full Day or Half Day. For
                half day, select <strong>Morning (AM)</strong> or{" "}
                <strong>Afternoon (PM)</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Set <strong>From Date</strong> and <strong>To Date</strong> (from
                date cannot be in the past when using the date picker).
              </li>
              <li className="leading-relaxed pl-1">
                Enter a <strong>reason</strong> (optional in the form).
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Submit Request</strong>. Status starts as{" "}
                <strong>Pending</strong>.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              The system checks that you have enough leave balance for paid leave
              types before accepting the request. No Pay Leave does not use a
              balance limit.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Impact:</strong> When approved, leave days are deducted from
              your credits, attendance is marked On Leave for those dates, and
              payroll may treat the days as non-working or unpaid (No Pay).
            </p>

            <DocScreenshot
              src="/docs/screenshots/leaves-request-form.png"
              alt="Leave request form drawer"
            />
          </div>

          <Separator />

          {/* Status tracking */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Leave status tracking</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              On <strong>My Leaves</strong>, each row shows type, dates, duration
              (full or half day), and status.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1">
              <li>
                <strong>Pending</strong> — waiting for approval
              </li>
              <li>
                <strong>Approved</strong> — leave is granted; credits updated
              </li>
              <li>
                <strong>Rejected</strong> — not granted; open the request (eye
                icon) to read the rejection reason if provided
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              You may receive in-app notifications and email (if enabled by your
              company) when leave is approved or rejected.
            </p>
          </div>

          <Separator />

          {/* Approval */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Leave approval process</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              On <strong>All Leaves</strong> (or Administrator{" "}
              <strong>Leave Requests</strong>), reviewers can search and filter,
              then approve or reject pending requests.
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Use search by name or code, and filters for status and leave type.
              </li>
              <li className="leading-relaxed pl-1">
                For a <strong>Pending</strong> request, click the green approve or
                red reject action.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Approve</strong> — applies leave to attendance and
                deducts credits (for paid types).
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Reject</strong> — on the <strong>Administrator</strong>{" "}
                leave screen, a dialog asks for a rejection reason (required). On
                the Manage Leaves <strong>All Leaves</strong> tab, rejection may
                require a reason at the system level — if reject fails, contact
                your administrator.
              </li>
              <li className="leading-relaxed pl-1">
                You <strong>cannot approve your own</strong> leave; another
                approver must handle it.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Who can approve depends on role and Settings → Approvals (leave
              approver mappings). Generally HR, HR Admin, and Administrator can
              approve employee leave; higher roles are needed to approve leave for
              HR or HR Admin staff. Assigned leave approvers can approve for
              employees mapped to them.
            </p>

            <DocScreenshot
              src="/docs/screenshots/leaves-approval.png"
              alt="Leave approval list with filters and actions"
            />
          </div>

          <Separator />

          {/* History */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Leave history</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>My Leaves</strong> lists all your requests with pagination.
            </p>
            <p className="text-sm text-muted-foreground">
              On <strong>Leave Credits</strong>, the{" "}
              <strong>Leave Transaction History</strong> table shows your past
              requests with type, dates, status, and reason — useful as a personal
              leave history view.
            </p>
            <p className="text-sm text-muted-foreground">
              Administrators also have <strong>Conversion History</strong> for
              company leave-to-cash conversion records (separate from everyday
              leave requests).
            </p>

            <DocScreenshot
              src="/docs/screenshots/leaves-history.png"
              alt="Leave credits and transaction history table"
            />
          </div>

          <Separator />

          {/* Balances / credits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Leave balances (credits)</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Open the <strong>Leave Credits</strong> tab to see remaining days
              for sick, vacation, maternity, and emergency leave. No Pay Leave is
              shown as unlimited (unpaid).
            </p>
            <p className="text-sm text-muted-foreground">
              Your <strong>Dashboard</strong> may also summarize leave balances.
            </p>
            <p className="text-sm font-medium text-foreground">
              HR Admin and Administrator
            </p>
            <p className="text-sm text-muted-foreground">
              On Leave Credits, use search and department filter, then{" "}
              <strong>Edit</strong> an employee to adjust sick, vacation,
              maternity, or emergency totals. Changes affect future leave
              requests and payroll leave conversion where applicable.
            </p>

            <DocScreenshot
              src="/docs/screenshots/leaves-credits.png"
              alt="Leave credits balance cards and management table"
            />
          </div>

          <Separator />

          {/* Admin management */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Leave management (administrator)</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Administrators use the expanded leave area (same sidebar link, different
              layout):
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-1">
              <li>
                <strong>Leave Requests</strong> — all company requests with filters;
                reject uses a required reason dialog
              </li>
              <li>
                <strong>Conversion History</strong> — records of leave converted to
                pay
              </li>
              <li>
                <strong>Conversion Settings</strong> — which leave types convert,
                SIL targets, conversion rate (affects payroll conversion)
              </li>
              <li>
                <strong>Leave Credits</strong> — manage balances for all employees
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Conversion settings are documented in System Settings documentation
              under related leave conversion (administrator-only).
            </p>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Leave permissions</h3>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-3 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium">Employee</th>
                    <th className="px-3 py-2 font-medium">HR</th>
                    <th className="px-3 py-2 font-medium">HR Admin</th>
                    <th className="px-3 py-2 font-medium">Administrator</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {leaveAccessRows.map((row) => (
                    <tr key={row.action} className="border-b last:border-0">
                      <td className="px-3 py-2 text-foreground">{row.action}</td>
                      <td className="px-3 py-2">{row.employee}</td>
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

          {/* Needs confirmation */}
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
              Needs confirmation
            </p>
            <ul className="space-y-2 text-sm text-purple-900/90 dark:text-purple-300/90 list-disc list-inside ml-1">
              <li>
                How employees physically clock in (see Attendance documentation).
              </li>
              <li>
                Whether HR users should use a rejection-reason dialog on Manage
                Leaves (Administrator screen includes one; Manage Leaves All Leaves
                tab may behave differently).
              </li>
              <li>
                Administrator leave form includes an employee selector — confirm
                with IT/HR whether requests can be filed on behalf of another
                employee in your deployment.
              </li>
              <li>
                Automatic leave accrual schedules (not shown as a user-facing
                feature in the leave screens reviewed).
              </li>
            </ul>
          </div>

          {/* Important notes */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                Important notes
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Half-day leave requires Morning or Afternoon; full-day leave
                  must not include a half-day type.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  End date cannot be before start date. Insufficient balance
                  blocks submission for paid leave types.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Approved leave updates attendance and the company calendar where
                  those modules apply.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Assign leave approvers under System Settings → Approvals (Leave
                  type) so designated managers see All Leaves.
                </span>
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                Leave troubleshooting
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Insufficient leave credits</strong> — Check Leave
                  Credits or ask HR Admin to adjust your balance.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Half-day type required</strong> — Select Morning or
                  Afternoon when using Half Day duration.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot approve your own leave</strong> — Another
                  approver or HR must process the request.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Not allowed to approve</strong> — Your role or approver
                  mapping may not cover that employee; check Settings →
                  Approvals.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Request already approved or rejected</strong> — Status
                  cannot be changed again; submit a new request if needed.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Rejection reason required</strong> — Provide a clear
                  reason when rejecting (Administrator screen enforces this in the
                  dialog).
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>No All Leaves tab</strong> — Only HR roles and assigned
                  leave approvers see it; employees use My Leaves only.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Balance not updated</strong> — Refresh the page after
                  approval; contact HR if totals still look wrong.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/leaves" />
  </div>
);

export default LeavesDocs;
