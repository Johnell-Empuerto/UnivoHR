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

const AuditLogsDocs = () => (
  <div className="space-y-8">
    <section id="audit-logs" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Audit Logs Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Review system activity logs for security monitoring and
            compliance.
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
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Accessing audit logs
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                From the sidebar, go to{" "}
                <strong>Settings &gt; Audit Logs</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                The audit log page shows a chronological list of system
                events, including:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>User logins and logouts</li>
                  <li>Data creation, updates, and deletions</li>
                  <li>Permission changes</li>
                  <li>Payroll generation and status changes</li>
                  <li>System configuration changes</li>
                </ul>
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Filtering and searching logs
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Use date filters to narrow the time range.
              </li>
              <li className="leading-relaxed pl-1">
                Filter by user, action type (CREATE, UPDATE, DELETE, LOGIN),
                or module.
              </li>
              <li className="leading-relaxed pl-1">
                Each log entry shows: Timestamp, User name, Action, Module,
                Description, and IP address.
              </li>
              <li className="leading-relaxed pl-1">
                Click on a log entry to see additional details.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/audit-logs" />
  </div>
);

export default AuditLogsDocs;
