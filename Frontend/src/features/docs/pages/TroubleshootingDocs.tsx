import { AlertTriangle, Wrench } from "lucide-react";
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

const TroubleshootingDocs = () => (
  <div className="space-y-8">
    <section id="troubleshooting" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Troubleshooting Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Common errors and solutions for all modules across UnivoHR.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">System Administrator</Badge>
              <Badge variant="secondary">All Employees</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-sm">
                Attendance issues
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Clock in not working:</strong> Check that your
                assigned shift is active for today. Verify timezone settings
                are correct. Refresh the page and try again.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Missing biometric data:</strong> Ensure the device is
                online and user mapping is configured in Device Setup.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Incorrect attendance status:</strong> HR can
                manually correct attendance records from the Attendance
                Management page.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-sm">Payroll issues</h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Payroll generation fails:</strong> Verify that all
                required data exists: employee salaries, attendance records,
                pay rules, and payroll rules.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Incorrect pay calculations:</strong> Review pay rules
                and payroll rules for the correct multipliers and deduction
                rates.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Missing deductions:</strong> Ensure employee
                deductions (SSS, PhilHealth, Pag-IBIG) are configured in
                Employee Salary Setup.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-sm">
                Other common issues
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Email not sending:</strong> Verify SMTP settings are
                correct and test the connection from SMTP Settings.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Page not loading:</strong> Clear browser cache and
                refresh. Try a different browser (Chrome recommended).
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Permission denied:</strong> Contact the system
                administrator to check your user permissions.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>System running slowly:</strong> Check your internet
                connection. Try closing other browser tabs. If persistent,
                contact IT support.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/troubleshooting" />
  </div>
);

export default TroubleshootingDocs;
