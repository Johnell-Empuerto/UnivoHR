import { AlertTriangle, Info, Server } from "lucide-react";
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

const MigrationDocs = () => (
  <div className="space-y-8">
    <section id="migration" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Migration Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Migrate data from an old system or upgrade between versions of
            UnivoHR.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Server className="h-4 w-4 text-primary" />
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
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">
                Data migration overview
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Data migration involves transferring employee records,
                attendance logs, leave balances, and payroll history from
                your existing system.
              </li>
              <li className="leading-relaxed pl-1">
                Plan the migration in this order: Branches → Employees →
                Shifts/Assignments → Leave Credits → Attendance History →
                Payroll History.
              </li>
              <li className="leading-relaxed pl-1">
                Always take a full backup before starting any migration.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-sm">
                Important considerations
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Employee codes must be unique. Map old employee IDs to the
                new code format before importing.
              </li>
              <li className="leading-relaxed pl-1">
                Leave balances should be computed as of the migration date.
              </li>
              <li className="leading-relaxed pl-1">
                Attendance history from the old system can be imported for
                reference but may not be editable.
              </li>
              <li className="leading-relaxed pl-1">
                Test the migration in a staging environment first before
                running on production.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/migration" />
  </div>
);

export default MigrationDocs;
