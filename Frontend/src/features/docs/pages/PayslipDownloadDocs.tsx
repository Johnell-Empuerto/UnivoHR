import { CheckCircle2, Download, Users } from "lucide-react";
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

const PayslipDownloadDocs = () => (
  <div className="space-y-8">
    <section id="payslip-download" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Payslip Download Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Download individual or batch payslips for distribution to
            employees.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Download className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">HR Admin</Badge>
              <Badge variant="secondary">Payroll Admin</Badge>
              <Badge variant="secondary">Employee</Badge>
              <Badge variant="outline">After payroll is generated</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Downloading an individual payslip
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>From Payroll Details:</strong> After generating
                payroll, click <strong>View Details</strong> on any employee
                record.
              </li>
              <li className="leading-relaxed pl-1">
                On the Payroll Details page, click the{" "}
                <strong>Export PDF</strong> button in the top-right corner.
              </li>
              <li className="leading-relaxed pl-1">
                The payslip PDF downloads automatically. It includes the full
                salary breakdown — earnings, deductions, and net pay.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Downloading payslips as an employee
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, click <strong>My Payroll</strong> or{" "}
                <strong>My Payslips</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                The page shows your payroll history by month/cutoff period.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Download</strong> or{" "}
                <strong>View Payslip</strong> on any payroll period to get
                your PDF payslip.
              </li>
            </ol>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/payslip-download" />
  </div>
);

export default PayslipDownloadDocs;
