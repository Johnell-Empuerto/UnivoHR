import { CheckCircle2, FileText } from "lucide-react";
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

const EmployeeKpiResultsDocs = () => (
  <div className="space-y-8">
    <section id="employee-kpi-results" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Employee KPI Results Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Review completed employee evaluation results, scores,
            recommendations, and view the full breakdown of each KPI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">
                Who should use this
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Administrator</Badge>
              <Badge variant="outline">After evaluations exist</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Viewing evaluation results
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, navigate to{" "}
                <strong>Performance &gt; Employee KPI Results</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                The page lists all employees with completed evaluations,
                showing: Employee name, Final Score, Recommendation, and
                Evaluation period.
              </li>
              <li className="leading-relaxed pl-1">
                Click on an employee row or the <strong>View</strong> button
                to open the full evaluation result.
              </li>
              <li className="leading-relaxed pl-1">
                The detail view shows:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>Employee and evaluator information</li>
                  <li>Template name and status</li>
                  <li>Final score and recommendation</li>
                  <li>
                    Scores table with each KPI name, weight, score (/5),
                    weighted score, and remarks
                  </li>
                  <li>
                    Self evaluation, manager comments, and HR comments
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Use the search bar to find specific employees or filter by
                recommendation type.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Understanding scores</h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Each KPI item is scored by the evaluator from 1 to 5.
              </li>
              <li className="leading-relaxed pl-1">
                The weighted score = (score / 5) &times; weight.
              </li>
              <li className="leading-relaxed pl-1">
                The final score is the sum of all weighted scores.
              </li>
              <li className="leading-relaxed pl-1">
                The recommendation is based on the final score and company
                policy: Regularize, Extend Probation, or Terminate.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/employee-kpi-results" />
  </div>
);

export default EmployeeKpiResultsDocs;
