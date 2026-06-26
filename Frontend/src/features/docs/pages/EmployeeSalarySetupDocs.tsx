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

const EmployeeSalarySetupDocs = () => (
  <div className="space-y-8">
    <section id="employee-salary-setup" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Employee Salary Setup Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to configure employee salaries, pay rates, working
            days, and deductions in UnivoHR. Salary settings are managed in a
            dedicated Employee Salary Settings page under Payroll, not in the
            employee record itself.
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
              <Badge variant="secondary">Payroll Admin</Badge>
              <Badge variant="outline">After creating employees</Badge>
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
                  <strong>After employees are created</strong> — set their
                  salary details so payroll can be processed.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Salary adjustments</strong> — update basic salary,
                  working days, or overtime rates.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>New deductions</strong> — add government or loan
                  deductions for an employee.
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Accessing employee salary settings
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open Payroll.</strong> From the sidebar menu, click{" "}
                <strong>Payroll</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Settings tab.</strong> Inside Payroll, click
                the <strong>Settings</strong> tab. The{" "}
                <strong>Employee Salary Settings</strong> page opens with the
                subtitle: <em>Manage salary and deductions per employee</em>.
              </li>
              <li className="leading-relaxed pl-1">
                The <strong>Employee Salary List</strong> card shows a table
                with columns: Name, Employee Code, Basic Salary, Daily Rate,
                OT Rate, Working Days, and Action (Edit button).
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Search for an employee.</strong> Use the{" "}
                <strong>Search by name or employee code...</strong> field to
                find the employee whose salary you want to configure.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Setting basic salary and rates
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                In the table, click the <strong>Edit</strong> button next to
                the employee. The{" "}
                <strong>Edit Salary & Deductions</strong> dialog opens showing
                the employee's name and code at the top.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Basic Salary (Monthly).</strong> Enter the employee's
                monthly base salary in this field (placeholder: Basic Salary).
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Working Days per Month.</strong> Enter the number of
                working days (placeholder: 26). This is used to compute the
                daily rate for deductions. Helper text:{" "}
                <em>Used to compute daily rate for deductions</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Daily Rate (Auto-computed).</strong> This field shows
                the calculated daily rate based on basic salary ÷ working
                days. It updates automatically when you change salary or
                working days.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Overtime Rate (per hour).</strong> Enter the hourly
                overtime rate for the employee (placeholder: Overtime Rate).
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Save Salary Changes</strong> to apply. A green
                message says <strong>Salary updated</strong>.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding government deductions
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                In the same dialog, scroll to the{" "}
                <strong>Government Deductions</strong> section.
              </li>
              <li className="leading-relaxed pl-1">
                Open the deduction type dropdown (default:{" "}
                <strong>Select Type</strong>) and choose one of:{" "}
                <strong>SSS</strong>, <strong>PhilHealth</strong>,{" "}
                <strong>Pag-IBIG</strong>,{" "}
                <strong>Tax Withholding</strong>, <strong>Loan</strong>, or{" "}
                <strong>Other</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Enter the deduction amount in the{" "}
                <strong>Amount</strong> field.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Add</strong>. A green message says{" "}
                <strong>Deduction added</strong>. The deduction appears in
                the list below.
              </li>
              <li className="leading-relaxed pl-1">
                To remove a deduction, click the <strong>Delete</strong>{" "}
                button next to it.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Configuring late deduction settings
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Scroll to the{" "}
                <strong>Late Deduction Settings</strong> section.
              </li>
              <li className="leading-relaxed pl-1">
                Open the type dropdown and choose one of:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Fixed (per late)</strong> — a fixed amount per
                    late instance
                  </li>
                  <li>
                    <strong>Per Minute</strong> — a fixed amount per minute
                    late
                  </li>
                  <li>
                    <strong>Salary Based</strong> — auto-computed from salary
                    based on minutes late
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Enter the amount (for Fixed or Per Minute types). The
                placeholder shows <em>Amount</em>.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Save</strong>. A green message says{" "}
                <strong>Late deduction saved</strong>. The current method
                shows below (e.g., <em>Current: Per Minute</em>).
              </li>
              <li className="leading-relaxed pl-1">
                To remove, click <strong>Remove</strong>.
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
                  <strong>Separate from employee record:</strong> Salary and
                  deductions are managed in Payroll &gt; Settings, not in the
                  employee's profile.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Working days affects daily rate:</strong> Changing
                  the working days per month recalculates the daily rate
                  automatically.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Permission required:</strong> You need the{" "}
                  <strong>payroll.settings</strong> permission to access
                  Employee Salary Settings.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/employee-salary-setup" />
  </div>
);

export default EmployeeSalarySetupDocs;
