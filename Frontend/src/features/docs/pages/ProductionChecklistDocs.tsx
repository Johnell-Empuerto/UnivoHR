import { CheckCircle2, ClipboardList, Server, Users } from "lucide-react";
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

const ProductionChecklistDocs = () => (
  <div className="space-y-8">
    <section id="production-checklist" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Production Checklist</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Final verification checklist before going live with UnivoHR.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">System Administrator</Badge>
              <Badge variant="secondary">IT</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Pre-launch verification
              </h3>
            </div>
            <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                ✅ All Phase 1-5 setup is complete (branches, settings,
                devices, employees, user accounts).
              </li>
              <li className="leading-relaxed pl-1">
                ✅ SMTP and email templates configured — test email works.
              </li>
              <li className="leading-relaxed pl-1">
                ✅ Attendance devices set up, user mapping done, and test
                punches recorded successfully.
              </li>
              <li className="leading-relaxed pl-1">
                ✅ Employee shifts and rest days assigned correctly.
              </li>
              <li className="leading-relaxed pl-1">
                ✅ Pay rules and payroll rules configured according to
                company policy.
              </li>
              <li className="leading-relaxed pl-1">
                ✅ Test payroll generated and verified for a sample cutoff
                period.
              </li>
              <li className="leading-relaxed pl-1">
                ✅ SSL certificate installed — site accessible via HTTPS.
              </li>
              <li className="leading-relaxed pl-1">
                ✅ Database backups configured (daily automated).
              </li>
              <li className="leading-relaxed pl-1">
                ✅ User accounts created for all employees with correct
                permissions.
              </li>
              <li className="leading-relaxed pl-1">
                ✅ HR policies published and visible to employees.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Go-live steps</h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Announce the go-live date to all employees.
              </li>
              <li className="leading-relaxed pl-1">
                Train HR admins and employees on using the system.
              </li>
              <li className="leading-relaxed pl-1">
                Start with attendance capturing for the new period.
              </li>
              <li className="leading-relaxed pl-1">
                Monitor the system closely for the first week.
              </li>
              <li className="leading-relaxed pl-1">
                Resolve any issues reported by users promptly.
              </li>
            </ol>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/production-checklist" />
  </div>
);

export default ProductionChecklistDocs;
