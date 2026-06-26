import { AlertTriangle, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DocsNavigation from "../components/DocsNavigation";





const PayrollAdminDocs = () => (
  <div className="space-y-8">
    <section id="payroll" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Payroll</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            UnivoHR payroll covers monthly cutoff runs for active employees,
            per-employee salary and deduction setup, payslip review, marking pay
            as released, and separate final pay for resigned or terminated staff.
             Access to payroll features is determined by the permissions assigned to your user account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Payroll overview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Payroll is organized around a <strong>cutoff period</strong> (start
              date, end date) and a <strong>pay date</strong>. When you generate
              payroll, the system builds pay for each <strong>active</strong>{" "}
              employee using data already in UnivoHR — including attendance,
              approved leave, approved overtime, company calendar day types,
              pay rate multipliers, and deductions you configured per employee.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              After generation, each employee has a record showing earnings
              (basic pay for the cutoff, overtime pay, leave conversion if
              applicable), deductions (late, absent, government contributions),
              and <strong>net salary</strong>. Status is either unpaid or paid.
            </p>
          </div>



          {/* Admin: Records */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Payroll Records (administrators)</h3>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Open <strong>Payroll</strong> → tab <strong>Payroll Records</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Choose the <strong>Payroll Period</strong> (month). The system
                uses the first and last day of that month as the cutoff range.
              </li>
              <li className="leading-relaxed pl-1">
                Review the summary cards: Total Employees, Total Payout, Total
                Deductions, Leave Conversion, and Average Salary.
              </li>
              <li className="leading-relaxed pl-1">
                Each generated batch appears as a card showing cutoff dates and
                pay date. Inside the table you will see per employee: Basic
                Salary, Overtime, Leave Conv., Deductions, Net Salary, and
                Status (PAID or UNPAID).
              </li>
              <li className="leading-relaxed pl-1">
                Use <strong>View Details</strong> (eye icon) to open the full{" "}
                <strong>Payroll Details</strong> page, or download a payslip PDF
                from the row or details page.
              </li>
              <li className="leading-relaxed pl-1">
                Use <strong>Mark Paid</strong> on one row, or{" "}
                <strong>Mark Batch Paid</strong> on the batch header to mark all
                unpaid records in that cutoff at once.
              </li>
              <li className="leading-relaxed pl-1">
                Use <strong>Delete Batch</strong> only for batches with no paid
                records (removes that payroll run permanently).
              </li>
            </ol>

            
          </div>

          <Separator />

          {/* Generate */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Generate Payroll</h3>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Go to the <strong>Generate Payroll</strong> tab.
              </li>
              <li className="leading-relaxed pl-1">
                Select <strong>Cutoff Start</strong>, <strong>Cutoff End</strong>
                , and <strong>Pay Date</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Generate Payroll</strong>. Wait for the success
                message, then check <strong>Payroll Records</strong>.
              </li>
            </ol>
            <div className="p-3 rounded-lg border border-border/50 bg-muted/20 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">What generation uses (in this system)</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Active employees only</li>
                <li>Each employee’s basic salary, working days per month, and overtime rate (Settings tab)</li>
                <li>Attendance records in the cutoff (present, late, absent, half day, leave)</li>
                <li>Approved leave requests and whether leave types are paid</li>
                <li>Approved overtime hours × overtime rate</li>
                <li>Calendar day types (regular, holidays, special days) and pay multipliers from System Settings → Pay Rules</li>
                <li>Government deductions and late deduction rules per employee (Settings tab)</li>
                <li>Leave conversion amounts recorded for the employee, when applicable</li>
              </ul>
              <p className="text-xs">
                On-screen note: existing payroll for the same cutoff is overwritten when you generate again.
              </p>
            </div>

            
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Payroll Details &amp; payslip download</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              From Payroll Records, open an employee’s details to see employee
              information, payroll period, paid/unpaid status, and a full{" "}
              <strong>Salary Breakdown</strong>: monthly salary, this cutoff
              earnings, overtime pay, leave conversion, late and absent
              deductions, itemized government contributions (SSS, PhilHealth,
              Pag-IBIG, tax, loan, other when configured), and net salary.
            </p>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Click <strong>Export PDF</strong> on the details page to download
                that employee’s payslip as a PDF file.
              </li>
            </ol>

            
          </div>

          <Separator />

          {/* Settings tab */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">
              Settings tab — Employee Salary Settings
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This tab is <strong>not</strong> company-wide pay multipliers
             (those are under <strong>System Settings → Pay Rules</strong> for
             users with the required permissions). Here you set up each employee before generating
              payroll.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Search employees by name or code, then click <strong>Edit</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Set <strong>Basic Salary (Monthly)</strong>,{" "}
                <strong>Working Days per Month</strong> (default 26), and{" "}
                <strong>Overtime Rate (per hour)</strong>. Daily rate is
                calculated automatically (basic salary ÷ working days).
              </li>
              <li className="leading-relaxed pl-1">
                Under <strong>Government Deductions</strong>, add types: SSS,
                PhilHealth, Pag-IBIG, Tax Withholding, Loan, or Other — each with
                an amount. You can delete entries you no longer need.
              </li>
              <li className="leading-relaxed pl-1">
                Under <strong>Late Deduction Settings</strong>, choose one
                method: Fixed (per late occurrence), Per Minute, or Salary
                Based (auto from salary; amount field disabled). Save or remove
                late settings as needed.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Save Salary Changes</strong> when finished.
              </li>
            </ol>

            
          </div>

          <Separator />

          {/* Final Pay */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Final Pay</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For employees who <strong>resigned</strong> or were{" "}
              <strong>terminated</strong>, use the <strong>Final Pay</strong> tab
              — separate from regular monthly payroll.
            </p>
            <p className="text-sm font-medium text-foreground">Pending Final Pay</p>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground mb-4">
              <li className="leading-relaxed pl-1">
                Search pending employees by name or code.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Preview</strong> to see a calculation (days
                worked, salary until last day, unused vacation leave, leave
                 conversion amount, total final pay). Users with the required permissions can preview and process.
              </li>
              <li className="leading-relaxed pl-1">
                From the preview, confirm and <strong>Process</strong> final pay
                to save it. The employee moves out of the pending list.
              </li>
            </ol>
            <p className="text-sm font-medium text-foreground">
              Processed Final Pay History
            </p>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Scroll to the history section below the pending table.
              </li>
              <li className="leading-relaxed pl-1">
                Search processed records, open details, or{" "}
                <strong>download</strong> the final pay slip PDF.
              </li>
            </ol>

            
          </div>

          <Separator />

          {/* Employee view */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">My Payroll (employees &amp; HR)</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you are not on the admin payroll screen, opening{" "}
              <strong>Payroll</strong> shows <strong>My Payroll</strong> with
              your own data only.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Review overview cards: Monthly Salary, Daily Rate, Overtime
                Rate, and Active Deductions (total monthly government
                deductions).
              </li>
              <li className="leading-relaxed pl-1">
                Pick a <strong>Payroll Period</strong> month and click{" "}
                <strong>Refresh</strong> if needed.
              </li>
              <li className="leading-relaxed pl-1">
                In <strong>Payroll History</strong>, see cutoff period, pay date,
                this cutoff earnings, deductions, net salary, and status.
              </li>
              <li className="leading-relaxed pl-1">
                Click the eye icon for a <strong>Salary Breakdown</strong> dialog
                (earnings, overtime, leave conversion, late/absent/government
                deductions, net salary).
              </li>
              <li className="leading-relaxed pl-1">
                Click the download icon to save your payslip PDF for that period.
              </li>
            </ol>

            
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
                  Configure calendar holidays and System Settings (attendance
                  rules, pay rules, leave conversion) before running payroll for
                  a new period.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Mark Batch Paid</strong> cannot be used if every record
                  in the batch is already paid. <strong>Delete Batch</strong> is
                  disabled if any record in the batch is already paid.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  The admin table’s <strong>Export</strong> action on a batch
                  shows “coming soon” — use per-employee download instead.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  This system does not include a separate “bonus” line item in
                  payroll tables; only basic pay, overtime, leave conversion, and
                  listed deductions appear.
                </span>
              </li>
            </ul>
          </div>

          {/* Tips */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-sm text-foreground mb-3">
              Tips &amp; warnings
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-amber-600 shrink-0">⚠</span>
                <span>
                  Generating payroll again for the same cutoff <strong>overwrites</strong>{" "}
                  existing records for that period.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">✓</span>
                <span>
                  Complete attendance approval and overtime approval before
                  generate.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">✓</span>
                <span>
                  Update employee salary and deductions in the Settings tab when
                  someone newly joins or changes pay.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 shrink-0">⚠</span>
                <span>
                  Deleting a payroll batch is permanent and only for unpaid
                  batches.
                </span>
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                Troubleshooting
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>No payroll data for the month</strong> — Generate
                  payroll first, or select the correct payroll period month.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Payroll not generated yet</strong> when opening details
                  — Run Generate Payroll for that cutoff.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Wrong net pay</strong> — Check attendance, approved
                  leave/overtime, calendar, Pay Rules, and the employee’s salary
                  and deduction settings.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot delete batch</strong> — At least one payslip in
                  the batch is already marked paid.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Download payslip failed</strong> — Try again; ensure
                  payroll exists for that row.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>I only see My Payroll</strong> — Your account uses the
                  employee view; contact users with the required permissions for
                  payroll management.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Final pay preview failed</strong> — Employee may
                  already be processed, or separation dates may be incomplete.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/payroll-admin" />
  </div>
);

export default PayrollAdminDocs;
