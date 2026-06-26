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

const MyKpiResultsDocs = () => (
  <div className="space-y-8">
    <section id="my-kpi-results" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">My KPI Results Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            View your completed KPI evaluations, scores, and recommendations
            as an employee.
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
              <Badge variant="outline">After evaluations are assigned</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Viewing your KPI results
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, click <strong>My Performance</strong> then{" "}
                <strong>KPI Results</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                The page lists your completed evaluations showing: Evaluation
                period, Template name, Final score, Recommendation, and
                Status.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>View</strong> on any evaluation to see the full
                breakdown:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    Scores per KPI criteria with weights and remarks
                  </li>
                  <li>Evaluator and HR comments</li>
                  <li>Your self-evaluation (if submitted)</li>
                  <li>Final recommendation</li>
                </ul>
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Understanding your score
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Each KPI is scored from 1 to 5 by your evaluator.
              </li>
              <li className="leading-relaxed pl-1">
                The weighted score is calculated as (score / 5) &times; weight.
              </li>
              <li className="leading-relaxed pl-1">
                The final score determines the recommendation: Regularize,
                Extend Probation, or other actions.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/my-kpi-results" />
  </div>
);

export default MyKpiResultsDocs;
