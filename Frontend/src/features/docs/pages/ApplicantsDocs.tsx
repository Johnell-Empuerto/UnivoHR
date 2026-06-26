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

const ApplicantsDocs = () => (
  <div className="space-y-8">
    <section id="applicants" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Applicants Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Track job applicants through the hiring pipeline, manage their
            status, and process their applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Administrator</Badge>
              <Badge variant="outline">After job positions + workflow</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding an applicant
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open Applicants.</strong> From the sidebar, click{" "}
                <strong>Recruitment</strong> then{" "}
                <strong>Applicants</strong>. The page shows the subtitle:{" "}
                <em>Manage job applicants and track their progress</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Applicant.</strong> You are taken to the{" "}
                <strong>Add Applicant</strong> form page.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in the details:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>First Name *</strong> and{" "}
                    <strong>Last Name *</strong>
                  </li>
                  <li>
                    <strong>Middle Name</strong> and <strong>Suffix</strong>{" "}
                    (optional)
                  </li>
                  <li>
                    <strong>Email</strong> and <strong>Phone</strong>
                  </li>
                  <li>
                    <strong>Job Position</strong> — select an open position
                  </li>
                  <li>Additional fields as configured</li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Save</strong>. The applicant appears in the list
                with status <strong>Initial</strong>.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing applicants
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Search by name, filter by status (Initial, Pending, Final
                Interview, Exam Interview, Completed, Fail) or by job position.
              </li>
              <li className="leading-relaxed pl-1">
                The table shows: Name, Position, Applied date, Status badge
                (color-coded), Workflow type (Dynamic/Legacy), Rating.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>View:</strong> Click the eye icon to open the detailed
                applicant profile showing personal info, resume, workflow
                progress, interview results, and status history.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Delete:</strong> Click the trash icon. Applicants with
                workflow history, interviews, or conversion records cannot be
                deleted.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/applicants" />
  </div>
);

export default ApplicantsDocs;
