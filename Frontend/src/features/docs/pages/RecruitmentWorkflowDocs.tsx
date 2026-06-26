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

const RecruitmentWorkflowDocs = () => (
  <div className="space-y-8">
    <section id="recruitment-workflow" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Recruitment Workflow Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Create workflow templates that define the hiring stages and
            automated steps for processing job applicants.
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
              <Badge variant="outline">After job positions</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Creating a workflow template
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open Recruitment Workflows.</strong> From the sidebar,
                click <strong>Recruitment</strong> then{" "}
                <strong>Workflows</strong>. The page shows the subtitle:{" "}
                <em>Manage workflow templates for recruitment pipelines</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Workflow.</strong> A dialog opens titled{" "}
                <strong>Add Workflow</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in the details:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Name *</strong> — workflow name (placeholder:
                    e.g., Standard Hiring Pipeline)
                  </li>
                  <li>
                    <strong>Description</strong> — optional description
                  </li>
                  <li>
                    <strong>Is Default</strong> — checkbox to mark as default
                  </li>
                  <li>
                    <strong>Is Active</strong> — checkbox for active status
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save.</strong> Click <strong>Create</strong>. A green
                message says <strong>Workflow created</strong>.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding stages to a workflow
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Click the <strong>Manage Stages</strong> icon (grid handle) on
                a workflow row. The <strong>Edit Stages</strong> dialog opens.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Add Stage</strong> at the bottom.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in stage details:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Stage Name *</strong> — e.g., Technical Interview
                  </li>
                  <li>
                    <strong>Stage Type *</strong> — select from: INTERVIEW,
                    EXAM, APPROVAL, DOCUMENT_CHECK, MEDICAL, BACKGROUND_CHECK,
                    OFFER, ONBOARDING, CONVERT_TO_EMPLOYEE, CUSTOM
                  </li>
                  <li>
                    <strong>Stage Category</strong> — e.g., Technical, Panel,
                    HR
                  </li>
                  <li>
                    <strong>Sequence Order</strong> — display order
                  </li>
                  <li>
                    Toggle: Is Required, Requires Assignment, Requires Score,
                    Requires Approval, Allow Skip, Auto Proceed, Is Terminal
                  </li>
                  <li>
                    <strong>Passing Score</strong> — optional minimum score
                  </li>
                  <li>
                    <strong>Days to Complete</strong> — optional SLA in days
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Add</strong> to save the stage.
              </li>
              <li className="leading-relaxed pl-1">
                Use the arrow buttons to reorder stages. Edit or delete stages
                using the pencil and trash icons.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing workflows
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Search and filter by Active/Inactive status.
              </li>
              <li className="leading-relaxed pl-1">
                The table shows: Name, Status badge, Default badge, Version,
                Branch, Job Position, Created date.
              </li>
              <li className="leading-relaxed pl-1">
                Edit name/description with the pencil icon. Delete with the
                trash icon.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/recruitment-workflow" />
  </div>
);

export default RecruitmentWorkflowDocs;
