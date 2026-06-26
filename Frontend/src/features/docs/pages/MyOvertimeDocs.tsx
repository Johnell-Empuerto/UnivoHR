import { CheckCircle2, Clock } from "lucide-react";
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

const MyOvertimeDocs = () => (
  <div className="space-y-8">
    <section id="my-overtime" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">My Overtime Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            File overtime requests and track their approval status as an
            employee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">All Employees</Badge>
              <Badge variant="outline">After overtime is enabled</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Filing an overtime request
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, click <strong>My Overtime</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Request Overtime</strong> or{" "}
                <strong>+ New Overtime</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in the details:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Date</strong> — the day you worked overtime
                  </li>
                  <li>
                    <strong>From Time</strong> and{" "}
                    <strong>To Time</strong> — the overtime hours
                  </li>
                  <li>
                    <strong>Reason</strong> — why overtime is needed
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Submit</strong>. The request goes to your
                approver.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Tracking overtime status
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                The overtime list shows all your requests with their current
                status.
              </li>
              <li className="leading-relaxed pl-1">
                Statuses: <strong>Pending</strong> (awaiting approval),{" "}
                <strong>Approved</strong>, <strong>Rejected</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Overtime approved before payroll cutoff is included in the
                next payroll computation.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/my-overtime" />
  </div>
);

export default MyOvertimeDocs;
