import { CheckCircle2, Gift, Users } from "lucide-react";
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

const MyBenefitsDocs = () => (
  <div className="space-y-8">
    <section id="my-benefits" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">My Benefits Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            View your company benefits and entitlements including government
            contributions and company-specific perks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">All Employees</Badge>
              <Badge variant="outline">After employee records exist</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Viewing your benefits
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, click <strong>My Benefits</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                The page displays your benefits summary, including:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Government Contributions</strong> — SSS, PhilHealth,
                    Pag-IBIG contribution details
                  </li>
                  <li>
                    <strong>Company Benefits</strong> — health insurance,
                    allowances, or other company-specific perks
                  </li>
                  <li>
                    <strong>Deduction History</strong> — monthly deduction
                    records per benefit type
                  </li>
                </ul>
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Viewing deduction history
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Deductions are shown per payroll period with type and amount.
              </li>
              <li className="leading-relaxed pl-1">
                Deduction types: SSS, PhilHealth, Pag-IBIG, Withholding Tax,
                Loan, Other.
              </li>
              <li className="leading-relaxed pl-1">
                Each deduction shows the period it was applied and the
                contribution amount.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/my-benefits" />
  </div>
);

export default MyBenefitsDocs;
