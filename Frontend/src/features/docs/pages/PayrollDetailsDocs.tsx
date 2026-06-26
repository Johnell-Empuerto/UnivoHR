import { CheckCircle2, Download, Wallet } from "lucide-react";
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

const PayrollDetailsDocs = () => (
  <div className="space-y-8">
    <section id="payroll-details" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Payroll Details Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            View the full breakdown of a generated payroll for an employee,
            including earnings, deductions, and net pay.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Administrator</Badge>
              <Badge variant="secondary">Payroll Admin</Badge>
              <Badge variant="outline">After payroll is generated</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Opening payroll details
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the <strong>Payroll Records</strong> tab, locate a
                generated payroll batch card (showing cutoff period and pay
                date).
              </li>
              <li className="leading-relaxed pl-1">
                Click the <strong>View Details</strong> button on a specific
                employee row within the batch. You are taken to the{" "}
                <strong>Payroll Details</strong> page.
              </li>
              <li className="leading-relaxed pl-1">
                The page header shows the <strong>Payroll Details</strong>{" "}
                title with subtitle:{" "}
                <em>View detailed salary breakdown</em>.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Understanding the detail view
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Employee Information</strong> card shows: Name,
                Employee Code, Payroll Period, Status (PAID/UNPAID badge),
                Branch.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Salary Breakdown</strong> section shows the full
                computation including:
                <ul className="list-disc list-inside mt-1 ml-4 space-y-0.5">
                  <li>Basic salary, overtime pay, night differential</li>
                  <li>Leave pay conversions</li>
                  <li>Late deductions and undertime deductions</li>
                  <li>Government deductions (SSS, PhilHealth, Pag-IBIG, Tax)</li>
                  <li>Loan and other deductions</li>
                  <li>Net pay (total after all additions and deductions)</li>
                </ul>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Download className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Exporting payslip as PDF
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                On the Payroll Details page, click the{" "}
                <strong>Export PDF</strong> button in the top-right.
              </li>
              <li className="leading-relaxed pl-1">
                The system generates a PDF payslip and downloads it
                automatically as{" "}
                <code>payslip-{`{employee_code}`}-{`{id}`}.pdf</code>.
              </li>
              <li className="leading-relaxed pl-1">
                A green message says{" "}
                <strong>Payslip downloaded successfully</strong>.
              </li>
            </ol>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/payroll-details" />
  </div>
);

export default PayrollDetailsDocs;
