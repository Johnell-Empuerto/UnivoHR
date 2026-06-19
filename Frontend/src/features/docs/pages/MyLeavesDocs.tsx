import { CheckCircle2, CalendarDays, Users } from "lucide-react";
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

const MyLeavesDocs = () => (
  <div className="space-y-8">
    <section id="my-leaves" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">My Leaves Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            File leave requests, check your leave credit balances, and view
            your leave history as an employee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">All Employees</Badge>
              <Badge variant="outline">After leave types are configured</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Filing a leave request
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, click <strong>Leaves</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Click the <strong>Request Leave</strong> or{" "}
                <strong>+ New Leave</strong> button.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in the details:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Leave Type</strong> — select from: Vacation
                    Leave, Sick Leave, Emergency Leave, Maternity Leave, etc.
                  </li>
                  <li>
                    <strong>From Date</strong> and <strong>To Date</strong>
                  </li>
                  <li>
                    <strong>Reason</strong> — brief explanation
                  </li>
                  <li>
                    <strong>Attachment</strong> — optional supporting document
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Submit</strong>. The request is sent to your
                approver. You can track its status (Pending, Approved,
                Rejected) from the leaves list.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Checking leave credits
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                The leaves page or dashboard shows your available leave
                credits per type.
              </li>
              <li className="leading-relaxed pl-1">
                Credits typically show: Total, Used, and Available for each
                leave type.
              </li>
              <li className="leading-relaxed pl-1">
                If you have insufficient credits, the system may still allow
                filing but with a warning or zero-pay option.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/my-leaves" />
  </div>
);

export default MyLeavesDocs;
