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

const MyManHoursDocs = () => (
  <div className="space-y-8">
    <section id="my-man-hours" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">My Man Hours Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Submit man-hour reports for additional work performed outside of
            your regular attendance schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">All Employees</Badge>
              <Badge variant="outline">After user account is created</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Submitting a man-hour report
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, click <strong>My Man Hours</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Add Report</strong> or{" "}
                <strong>New Man Hours</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in the details:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Date</strong> — the work date
                  </li>
                  <li>
                    <strong>Time In</strong> and <strong>Time Out</strong>
                  </li>
                  <li>
                    <strong>Description</strong> — what work was performed
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Submit</strong>. The report is sent for
                approval. Track status from the list (Pending, Approved,
                Rejected).
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Man hours vs overtime
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Man hours are for ad-hoc or project-based work outside
                regular hours, while overtime extends the regular shift.
              </li>
              <li className="leading-relaxed pl-1">
                Both types of work are compensated and included in payroll
                calculations.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/my-man-hours" />
  </div>
);

export default MyManHoursDocs;
