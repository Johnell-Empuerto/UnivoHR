import { CheckCircle2, FileText, Users } from "lucide-react";
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

const ReportsDocs = () => (
  <div className="space-y-8">
    <section id="reports" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Reports Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Generate, filter, and export official HR reports including
            employee master lists, attendance summaries, payroll registers,
            and performance analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">HR Admin</Badge>
              <Badge variant="secondary">Payroll Admin</Badge>
              <Badge variant="outline">After payroll exists</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Accessing reports
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, click <strong>Reports</strong>. The page
                shows the subtitle:{" "}
                <em>Generate, filter, and export official HR reports</em>.
              </li>
              <li className="leading-relaxed pl-1">
                The page has pill-shaped tab buttons for each report category:
                <strong>Employee</strong>, <strong>Leave</strong>,{" "}
                <strong>Attendance</strong>, <strong>Payroll</strong>,{" "}
                <strong>Benefits</strong>, and{" "}
                <strong>Performance</strong>.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Report categories and types
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Employee Reports:</strong> Master List, Active
                Employees, Inactive Employees, New Hires,
                Resigned/Terminated.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Leave Reports:</strong> Approved/Rejected Leaves,
                Leave Balance, Leave Usage, Leave Conversion.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Attendance Reports:</strong> Daily Attendance, Late
                Employees, Absent Employees, Monthly Summary, By Branch, By
                Department.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Payroll Reports:</strong> Payroll Summary, Paid/Unpaid
                Payroll, By Branch/Department, Net Pay Summary, Deduction
                Summary, Final Pay.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Benefits Reports:</strong> All Deductions, SSS,
                PhilHealth, Pag-IBIG, Withholding Tax, Loan &amp; Other,
                Government Contributions.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Performance Reports:</strong> All Evaluations,
                Completed, Pending, By Department, Completion Rate.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Filtering and exporting
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Select a report category tab, then choose a{" "}
                <strong>report type</strong> from the dropdown below the title.
              </li>
              <li className="leading-relaxed pl-1">
                Use the filter bar to refine by: search keyword, status,
                date range, and department.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Search</strong> to apply filters. Click the
                reset icon to clear all filters.
              </li>
              <li className="leading-relaxed pl-1">
                Click the <strong>Export</strong> button to download the
                report. Available formats depend on the report type (typically
                CSV or PDF).
              </li>
              <li className="leading-relaxed pl-1">
                Use pagination controls at the bottom to navigate through
                multi-page reports. Adjust rows per page (5, 10, 25, 50).
              </li>
            </ol>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/reports" />
  </div>
);

export default ReportsDocs;
