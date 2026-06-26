import { CheckCircle2, Eye } from "lucide-react";
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

const FormSubmissionsDocs = () => (
  <div className="space-y-8">
    <section id="form-submissions" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Form Submissions Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            View and manage submitted HR forms. Review employee answers,
            mark submissions as reviewed, and track completion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">HR Admin</Badge>
              <Badge variant="outline">After forms are assigned</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Viewing form submissions
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open Form Submissions.</strong> From the sidebar,
                click <strong>HR Forms</strong> then{" "}
                <strong>Submissions</strong>, or click the{" "}
                <strong>Submissions</strong> button from the HR Forms list.
              </li>
              <li className="leading-relaxed pl-1">
                The page lists all submitted forms, showing: Employee name,
                Form title, Submitted date, Status, and Actions.
              </li>
              <li className="leading-relaxed pl-1">
                Click the <strong>View</strong> button (eye icon) to open the
                full submission detail.
              </li>
              <li className="leading-relaxed pl-1">
                The detail view shows each question and the employee's answer.
              </li>
              <li className="leading-relaxed pl-1">
                Mark submissions as <strong>Reviewed</strong> once you have
                verified the answers.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Reviewing submitted answers
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Each submission shows the original form questions with the
                employee's responses.
              </li>
              <li className="leading-relaxed pl-1">
                Short Text, Long Text, Number, Date: shows the entered value.
              </li>
              <li className="leading-relaxed pl-1">
                Dropdown, Radio, Checkbox: shows the selected option(s).
              </li>
              <li className="leading-relaxed pl-1">
                Rating: shows the selected rating (1-5).
              </li>
              <li className="leading-relaxed pl-1">
                Use the search bar to find submissions by employee name or
                form title.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/form-submissions" />
  </div>
);

export default FormSubmissionsDocs;
