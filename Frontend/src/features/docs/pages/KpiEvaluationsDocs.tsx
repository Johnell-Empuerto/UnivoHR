import { CheckCircle2, ClipboardList } from "lucide-react";
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

const KpiEvaluationsDocs = () => (
  <div className="space-y-8">
    <section id="kpi-evaluations" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">KPI Evaluations Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Assign KPI evaluations to employees, track progress, review
            scores, and approve or reject completed evaluations.
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
              <Badge variant="outline">
                After KPI templates + employees
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Assigning an evaluation
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open KPI Evaluations.</strong> From the sidebar, click{" "}
                <strong>Performance</strong> then{" "}
                <strong>KPI Evaluations</strong>. The page subtitle:{" "}
                <em>Manage performance evaluations and approvals</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Assign.</strong> The{" "}
                <strong>Assign Evaluation</strong> dialog opens.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the employee</strong> using the employee
                picker. Search by name or code.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the evaluator</strong> — the person who will
                rate the employee. Must have a user account.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select a KPI Template</strong> — choose a template
                with the criteria to evaluate.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set the evaluation period</strong> — start and end
                dates for this evaluation.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Assign</strong>. The evaluation appears in the
                list with status <strong>Draft</strong>.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Bulk assigning evaluations
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Click <strong>Bulk Assign</strong> next to the Assign button.
              </li>
              <li className="leading-relaxed pl-1">
                Select a KPI Template and Evaluator (applied to all).
              </li>
              <li className="leading-relaxed pl-1">
                Set the evaluation period (start and end dates are required
                for bulk).
              </li>
              <li className="leading-relaxed pl-1">
                Search and select employees using checkboxes, or use "Assign
                to all matching" for large batches.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Assign to N employee(s)</strong>. A summary
                shows how many were created and skipped.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Reviewing and approving
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Filter by status: Draft, In Progress, Submitted, Completed,
                Approved.
              </li>
              <li className="leading-relaxed pl-1">
                The table shows: Employee name, Evaluator, Template, Score,
                Recommendation, Status badge.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>View detail:</strong> Click the eye icon to see full
                scores per KPI, self-evaluation, manager comments, and HR
                comments.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Approve:</strong> When status is Submitted, use the
                green checkmark. If the recommendation is{" "}
                <strong>Regularize</strong>, the employee's status changes
                from PROBATIONARY to REGULAR. If{" "}
                <strong>Terminate</strong>, a termination date and reason
                are required.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Reject:</strong> Use the red X icon. Add HR comments
                explaining why.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/kpi-evaluations" />
  </div>
);

export default KpiEvaluationsDocs;
