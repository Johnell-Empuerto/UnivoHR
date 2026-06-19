import { CheckCircle2, ClipboardList, Users } from "lucide-react";
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

const MyRecruitmentAssignmentsDocs = () => (
  <div className="space-y-8">
    <section id="my-recruitment-assignments" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            My Recruitment Assignments Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            View applicants assigned to you for interview or evaluation and
            submit your feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">
                Who should use this
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">HR Admin</Badge>
              <Badge variant="secondary">Evaluator</Badge>
              <Badge variant="outline">After applicants exist</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Accessing your interview assignments
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, click <strong>Recruitment</strong> then{" "}
                <strong>My Assignments</strong> (or{" "}
                <strong>My Interviews</strong>).
              </li>
              <li className="leading-relaxed pl-1">
                The page lists applicants assigned to you for evaluation,
                showing applicant name, job position, current stage, and
                deadline.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Evaluate</strong> or <strong>View</strong> on
                an applicant to open the evaluation form.
              </li>
              <li className="leading-relaxed pl-1">
                Fill in your assessment, score, and comments. Mark the stage
                as passed or failed.
              </li>
              <li className="leading-relaxed pl-1">
                Submit your evaluation. The applicant moves to the next stage
                or is marked accordingly.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Interview stages
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                If a workflow stage requires assignment, an evaluator is
                automatically or manually assigned.
              </li>
              <li className="leading-relaxed pl-1">
                Scoring is available when the stage has Requires Score
                enabled. Enter a score out of 5 with optional remarks.
              </li>
              <li className="leading-relaxed pl-1">
                If Auto Proceed is on, passing automatically moves the
                applicant to the next stage.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/my-recruitment-assignments" />
  </div>
);

export default MyRecruitmentAssignmentsDocs;
