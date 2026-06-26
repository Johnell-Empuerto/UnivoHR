import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
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

const SecurityPermissionsDocs = () => (
  <div className="space-y-8">
    <section id="security-permissions" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Security and Permissions Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Best practices for managing roles, permissions, and keeping the
            system secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
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
                Permission management overview
              </h3>
            </div>
            <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Go to <strong>Settings &gt; User Permissions</strong> to
                manage what each user can access.
              </li>
              <li className="leading-relaxed pl-1">
                Permissions are role-based. Common roles: Admin, HR Admin,
                Payroll Admin, Manager, Employee.
              </li>
              <li className="leading-relaxed pl-1">
                Each role has granular permissions for viewing, creating,
                editing, and deleting data in each module.
              </li>
              <li className="leading-relaxed pl-1">
                Users inherit the permissions of their role plus any
                individually assigned permissions.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-sm">Security best practices</h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Use the <strong>principle of least privilege</strong> — give
                users only the permissions they need.
              </li>
              <li className="leading-relaxed pl-1">
                Regularly review active users and remove accounts for
                resigned or terminated employees.
              </li>
              <li className="leading-relaxed pl-1">
                Enable <strong>Branch Access</strong> restrictions for
                multi-branch companies to limit data visibility.
              </li>
              <li className="leading-relaxed pl-1">
                Use strong passwords. The system enforces minimum password
                requirements.
              </li>
              <li className="leading-relaxed pl-1">
                Review <strong>Audit Logs</strong> periodically to detect
                unusual activity.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/security-permissions" />
  </div>
);

export default SecurityPermissionsDocs;
