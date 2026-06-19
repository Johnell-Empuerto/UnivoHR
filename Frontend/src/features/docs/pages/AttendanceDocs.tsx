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

const attendanceAccessRows = [
  {
    action: "Open Attendance page",
    employee: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
  },
  {
    action: "View Attendance Records tab (daily list)",
    employee: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
    note: "List shows employee attendance records for the selected date (administrator accounts are excluded from the list)",
  },
  {
    action: "Search and filter by status / date",
    employee: "Yes",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
  },
  {
    action: "Submit time modification request",
    employee: "Yes",
    hr: "No (button hidden)",
    hrAdmin: "No",
    admin: "No",
  },
  {
    action: "View Time Requests tab (own requests)",
    employee: "Yes",
    hr: "All requests",
    hrAdmin: "All requests",
    admin: "All requests",
  },
  {
    action: "Approve or reject time requests",
    employee: "No",
    hr: "Yes",
    hrAdmin: "Yes",
    admin: "Yes",
  },
];

const AttendanceDocs = () => (
  <div className="space-y-8">
    <section id="attendance" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Attendance</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            The <strong>Attendance</strong> module shows daily check-in and
            check-out times and status for your organization. Employees can ask
            HR to correct their times through <strong>time modification
            requests</strong>. HR staff review and approve or reject those
            requests.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Attendance overview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Open <strong>Attendance</strong> from the sidebar. The page has two
              tabs:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-1">
              <li>
                <strong>Attendance Records</strong> — view check-in, check-out,
                and status for a chosen date
              </li>
              <li>
                <strong>Time Requests</strong> — track or process time
                correction requests
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Your <strong>Dashboard</strong> also shows today&apos;s status,
              check-in, and check-out for quick reference.
            </p>

            
          </div>

          <Separator />

          {/* Time in / out */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Time in / time out</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              There is <strong>no Time In or Time Out button</strong> on the
              Attendance page or Dashboard. Check-in and check-out are recorded
              when attendance data is created for an employee (for example
              through your company&apos;s time clock, scanner, or an HR process).
            </p>
            <p className="text-sm text-muted-foreground">
              After you are checked in, you may see check-out as empty (—) until
              you check out for the day. Late status is applied based on company
              attendance rules configured in System Settings.
            </p>

            

            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300 mb-2">
                Needs confirmation
              </p>
              <p className="text-sm text-purple-900/90 dark:text-purple-300/90">
                Ask your HR administrator exactly how you should clock in and
                out at your workplace (device, location, or manual process). That
                step is outside this web screen.
              </p>
            </div>
          </div>

          <Separator />

          {/* History / Records */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Attendance history (records)</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              On <strong>Attendance Records</strong>, use filters at the top,
              then browse the table.
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Pick a <strong>date</strong> (defaults to today).
              </li>
              <li className="leading-relaxed pl-1">
                Optionally choose <strong>status</strong>: All, Present, Late,
                Absent, or On Leave.
              </li>
              <li className="leading-relaxed pl-1">
                Optionally <strong>search</strong> by employee name or code.
              </li>
              <li className="leading-relaxed pl-1">
                Review columns: Employee Code, Name, Check In, Date, Check Out,
                Status.
              </li>
              <li className="leading-relaxed pl-1">
                Use <strong>Rows per page</strong> and page arrows at the bottom
                for more entries.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Clear Filters</strong> to reset search and status.
              </li>
            </ol>

            <p className="text-sm font-medium text-foreground">Status labels</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1">
              <li>
                <strong>Present</strong> — checked in on time per active rules
              </li>
              <li>
                <strong>Late</strong> — arrived after the late threshold
              </li>
              <li>
                <strong>Absent</strong> — no valid attendance or very short work
                time
              </li>
              <li>
                <strong>On Leave</strong> — approved leave covers that day
              </li>
            </ul>

            <p className="text-sm text-muted-foreground">
              <strong>Impact:</strong> Attendance status and times feed payroll
              (late deductions, days worked) and HR reports. Approved leave marks
              days as On Leave.
            </p>

            
          </div>

          <Separator />

          {/* Corrections */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Attendance corrections (time requests)</h3>

            <p className="text-sm font-medium text-foreground">
              Employees — request a correction
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 mb-4">
              <li className="leading-relaxed pl-1">
                On <strong>Attendance Records</strong>, find your row for the
                date and click <strong>Request Change</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                In the dialog, confirm the date and current times shown.
              </li>
              <li className="leading-relaxed pl-1">
                Enter <strong>Requested Check-in</strong> and{" "}
                <strong>Requested Check-out</strong> (required).
              </li>
              <li className="leading-relaxed pl-1">
                Enter a <strong>Reason for Modification</strong> (required; at
                least a short explanation).
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Submit Request</strong>. Track status under{" "}
                <strong>Time Requests</strong>.
              </li>
            </ol>

            <p className="text-sm font-medium text-foreground">
              HR / HR Admin / Administrator — review requests
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Open the <strong>Time Requests</strong> tab (title shows all
                requests).
              </li>
              <li className="leading-relaxed pl-1">
                Compare original time, requested time, and reason.
              </li>
              <li className="leading-relaxed pl-1">
                For <strong>Pending</strong> rows, click <strong>Approve</strong>{" "}
                or <strong>Reject</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Approving updates the employee&apos;s attendance record with the
                new times.
              </li>
              <li className="leading-relaxed pl-1">
                Rejecting requires a <strong>rejection reason</strong> the
                employee can see.
              </li>
            </ol>

            <p className="text-sm text-muted-foreground">
              Request statuses: <strong>Pending</strong>,{" "}
              <strong>Approved</strong>, <strong>Rejected</strong>. You cannot
              submit a second pending request for the same attendance day until
              the first is resolved.
            </p>

            
          </div>

          <Separator />

          {/* Reports */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Attendance reports</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Attendance module does <strong>not</strong> include a download,
              export, or printable report button. Use the on-screen table and
              filters to review records. For exports, confirm with your HR team
              whether another tool or process is available.
            </p>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Attendance permissions</h3>
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
                  {attendanceAccessRows.map((row) => (
                    <tr key={row.action} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <span className="text-foreground">{row.action}</span>
                        {row.note && (
                          <span className="block text-xs mt-0.5">{row.note}</span>
                        )}
                      </td>
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
                Physical time clock, biometric, or geolocation setup used at your
                site (not configured in this Attendance screen).
              </li>
              <li>
                Whether employees should see all staff on the daily list or only
                their own row (the list is built for company-wide viewing by date).
              </li>
              <li>
                Other status values such as half-day that may appear in data but
                are not in the status filter dropdown.
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
                  Approved time requests change stored check-in/out times;
                  rejected requests leave original times unchanged.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Active attendance rules (late threshold, grace period) are set
                  under System Settings → Attendance and affect how Late status
                  is calculated for payroll.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  You can open Time Requests directly with a link that includes{" "}
                  <strong>?tab=time-requests</strong> in the address bar when
                  shared by your team.
                </span>
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                Attendance troubleshooting
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>No Request Change button</strong> — Only employees see
                  this action. HR and administrators use Time Requests to
                  approve others&apos; submissions.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Submit Request disabled</strong> — Fill in both times
                  and a reason before submitting.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Pending request already exists</strong> — Wait for HR to
                  approve or reject the existing request for that day.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Wrong or missing times</strong> — Submit a time
                  modification request or contact HR.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>No records for a date</strong> — You may have been
                  absent, on approved leave, or not yet clocked in.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Check-out shows —</strong> — You may still be checked
                  in for the day or checkout was not recorded yet.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/attendance" />
  </div>
);

export default AttendanceDocs;
