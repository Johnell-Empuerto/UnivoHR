import { AlertTriangle, Info, Calculator } from "lucide-react";
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
                <li>Enterprise payroll: auto-computed SSS, PhilHealth, Pag-IBIG from bracket tables</li>
                <li>Enterprise payroll: BIR TRAIN withholding tax based on taxable income</li>
                <li>Enterprise payroll: per-employee allowances (total_allowances added to taxable income)</li>
                <li>Enterprise payroll: employer-side contribution tracking (SSS, PhilHealth, Pag-IBIG)</li>
                <li>Leave conversion amounts recorded for the employee, when applicable</li>
              </ul>
              <p className="text-xs">
                On-screen note: existing payroll for the same cutoff is overwritten when you generate again.
              </p>
            </div>

            
          </div>

          {/* Phase 4 — Enterprise Payroll */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Enterprise Payroll — Allowances, Approvals &amp; Government Contributions
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Phase 4 adds automatic government contribution bracket lookup,
              per-employee allowance management, and a payroll approval workflow.
              These features appear as new tabs in the Payroll page for users
              with the required permissions.
            </p>

            {/* Allowances */}
            <h4 className="font-semibold text-sm">Allowances tab</h4>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground mb-3">
              <li className="leading-relaxed pl-1">
                Define <strong>Allowance Types</strong> (name, default amount,
                taxable/recurring flag, frequency).
              </li>
              <li className="leading-relaxed pl-1">
                Assign allowances to specific employees with custom amounts
                and effective/end dates.
              </li>
              <li className="leading-relaxed pl-1">
                When payroll is generated, allowances are auto-summed into{" "}
                <strong>Total Allowances</strong> and added to taxable income.
              </li>
            </ol>

            {/* Approvals */}
            <h4 className="font-semibold text-sm">Approvals tab</h4>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground mb-3">
              <li className="leading-relaxed pl-1">
                View all generated payroll batches grouped by status (PENDING,
                APPROVED, REJECTED).
              </li>
              <li className="leading-relaxed pl-1">
                Request approval for a batch — attach remarks explaining the
                payroll run.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Approve</strong> or <strong>Reject</strong> a pending
                request. Approving a batch automatically marks all payroll
                records in that batch as PAID.
              </li>
            </ol>

            {/* Contribution Tables */}
            <h4 className="font-semibold text-sm">Contributions tab</h4>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                View read-only government contribution tables: <strong>SSS</strong>{" "}
                (bracket table, 500+ rows), <strong>PhilHealth</strong>,{" "}
                <strong>Pag-IBIG</strong>, and <strong>BIR Tax</strong> (TRAIN
                law withholding tax brackets).
              </li>
              <li className="leading-relaxed pl-1">
                Tables are auto-seeded with official 2024–2025 Philippine rates
                and updates require a database migration.
              </li>
              <li className="leading-relaxed pl-1">
                Payroll generation now automatically computes SSS, PhilHealth,
                Pag-IBIG, and withholding tax from these brackets — no need to
                enter manual deduction amounts (manual entries still override
                auto-computed values if higher).
              </li>
            </ol>
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
              Pag-IBIG, withholding tax, loan, other when configured),
              allowances, employer-side contributions, and net salary.
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
                  This system does not include a separate "bonus" line item in
                  payroll tables; only basic pay, overtime, leave conversion, and
                  listed deductions appear.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Enterprise Payroll</strong> automatically computes SSS,
                  PhilHealth, Pag-IBIG, and withholding tax from government bracket
                  tables. Manual deduction amounts still work — the system uses the
                  higher of manual vs. auto-computed value.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Allowances</strong> are defined in the Allowances tab and
                  assigned per employee. They are included in taxable income and
                  shown in the Salary Breakdown.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Payroll Approval</strong> links to batch status —
                  approving a batch automatically marks all its records as PAID.
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
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Government contribution is 0.00</strong> — Run the Phase 4
                  migration (053_enterprise_payroll_phase4.sql) to create the bracket
                  tables and seed data.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Allowances not showing in payroll</strong> — Define
                  allowance types and assign them to employees in the Allowances tab
                  before generating payroll.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Payroll approval not available</strong> — Verify your
                  account has the required permissions for payroll settings.
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
