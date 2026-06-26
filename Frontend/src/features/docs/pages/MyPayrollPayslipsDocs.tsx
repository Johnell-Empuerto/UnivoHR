import { CheckCircle2, Download } from "lucide-react";
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

const MyPayrollPayslipsDocs = () => (
  <div className="space-y-8">
    <section id="my-payroll-payslips" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            My Payroll / Payslips Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            View your payslips and payroll history as an employee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Download className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">All Employees</Badge>
              <Badge variant="outline">After payroll is processed</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Viewing your payslips
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, click <strong>My Payroll</strong> or{" "}
                <strong>My Payslips</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                The page shows your payroll history organized by month/cutoff
                period.
              </li>
              <li className="leading-relaxed pl-1">
                Summary cards display key figures: Basic Salary, Overtime Pay,
                Deductions, and Net Pay.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>View</strong> or{" "}
                <strong>Download Payslip</strong> on any payroll period to
                open or download your PDF payslip.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Understanding your payslip
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                The payslip shows: Payroll period, Basic salary, Overtime pay,
                Night differential, Leave conversions.
              </li>
              <li className="leading-relaxed pl-1">
                Deductions section includes: Late deductions, Undertime,
                SSS, PhilHealth, Pag-IBIG, Withholding Tax, Loans.
              </li>
              <li className="leading-relaxed pl-1">
                The <strong>Net Pay</strong> is the final amount after all
                additions and deductions.
              </li>
              <li className="leading-relaxed pl-1">
                Payslips are available for payrolls with PAID status.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/my-payroll-payslips" />
  </div>
);

export default MyPayrollPayslipsDocs;
