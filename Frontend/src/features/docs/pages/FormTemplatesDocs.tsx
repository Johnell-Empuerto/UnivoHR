import { CheckCircle2, FileText, ListChecks, Users } from "lucide-react";
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

const FormTemplatesDocs = () => (
  <div className="space-y-8">
    <section id="form-templates" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Form Templates Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Build custom HR forms such as clearance forms, resignation
            checklists, employee satisfaction surveys, and more.
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
              <Badge variant="outline">After employees exist</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Creating a form</h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open HR Forms.</strong> From the sidebar, click{" "}
                <strong>HR Forms</strong>. The page shows the subtitle:{" "}
                <em>Create and manage dynamic forms</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Create Form.</strong> The{" "}
                <strong>Create Form</strong> dialog opens.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Title *</strong> — e.g., Employee Satisfaction
                    Survey
                  </li>
                  <li>
                    <strong>Description</strong> — optional description
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Create</strong>. The form appears in the table.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding questions (form builder)
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Click the <strong>Manage Questions</strong> icon (list
                checklist icon) on a form row. The form builder opens.
              </li>
              <li className="leading-relaxed pl-1">
                The builder page title shows the form name with subtitle:{" "}
                <em>Add questions to your form</em>.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Add Question</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Question Label *</strong> — e.g., How satisfied
                    are you?
                  </li>
                  <li>
                    <strong>Field Type</strong> — select from: Short Text,
                    Long Text, Number, Date, Dropdown, Radio Options, Checkbox
                    Options, Rating 1-5
                  </li>
                  <li>
                    <strong>Options</strong> — required for Dropdown, Radio,
                    Checkbox. Enter comma-separated values (e.g., Excellent,
                    Good, Fair, Poor)
                  </li>
                  <li>
                    <strong>Required</strong> — checkbox to make the question
                    mandatory
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Add</strong>. The question appears in the
                builder list with its type badge and order number.
              </li>
              <li className="leading-relaxed pl-1">
                Edit or delete questions using the pencil and trash icons.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing forms
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Search forms by title. The table shows: Title, Status badge,
                Fields count, Assignments count, Submissions count, Created
                By, Created date.
              </li>
              <li className="leading-relaxed pl-1">
                Toggle Active/Inactive using the toggle button. Inactive forms
                cannot be assigned to employees.
              </li>
              <li className="leading-relaxed pl-1">
                Navigate to <strong>Assignments</strong> and{" "}
                <strong>Submissions</strong> using the buttons at the top.
              </li>
              <li className="leading-relaxed pl-1">
                Delete is only available for forms with zero assignments. For
                forms with active assignments, deactivate instead.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/form-templates" />
  </div>
);

export default FormTemplatesDocs;
