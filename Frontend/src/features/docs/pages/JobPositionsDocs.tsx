import { CheckCircle2, Users } from "lucide-react";
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

const JobPositionsDocs = () => (
  <div className="space-y-8">
    <section id="job-positions" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Job Positions Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to create and manage job positions in UnivoHR. Job
            Positions define the roles that applicants apply for and
            employees are assigned to.
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
              <Badge variant="outline">After employee management</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding a job position
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open Recruitment.</strong> From the sidebar, click{" "}
                <strong>Recruitment</strong> then{" "}
                <strong>Job Positions</strong>. The{" "}
                <strong>Job Positions</strong> page opens with the subtitle:{" "}
                <em>Manage open positions and job postings</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Position.</strong> Click the{" "}
                <strong>Add Position</strong> button. The{" "}
                <strong>Add Position</strong> dialog opens.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in the details:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Title *</strong> — job title (placeholder: e.g.,
                    Software Engineer)
                  </li>
                  <li>
                    <strong>Department</strong> — department name
                    (placeholder: e.g., IT)
                  </li>
                  <li>
                    <strong>Salary Range</strong> — pay range (placeholder:
                    e.g., 30k-50k)
                  </li>
                  <li>
                    <strong>Employment Type</strong> — select from:
                    Full-time, Part-time, Contract, Probationary, Internship
                  </li>
                  <li>
                    <strong>Branch</strong> — assign to a branch
                  </li>
                  <li>
                    <strong>Recruitment Workflow</strong> — select a workflow
                    template or Default (no workflow)
                  </li>
                  <li>
                    <strong>Description</strong> — job description
                  </li>
                  <li>
                    <strong>Requirements</strong> — job requirements
                  </li>
                  <li>
                    <strong>Status</strong> — Active, Closed, or On Hold
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save.</strong> Click{" "}
                <strong>Create Position</strong>. A green message says{" "}
                <strong>Job position created</strong>.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing job positions
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Use the search field and status filter (All Status, Active,
                Closed, On Hold) to find positions.
              </li>
              <li className="leading-relaxed pl-1">
                The table shows: Title, Department, Employment Type, Branch,
                Workflow, Salary Range, Status (color-coded badge), Created
                date, and Actions.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Edit:</strong> Click the Edit icon. Update fields and
                click <strong>Save Changes</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Activate/Deactivate:</strong> Click the toggle button
                to change status between Active and Closed/On Hold.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Delete:</strong> Click the Delete icon. Confirm in the
                dialog.
              </li>
            </ol>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/job-positions" />
  </div>
);

export default JobPositionsDocs;
