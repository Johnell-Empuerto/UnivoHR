import { CheckCircle2, Info, Users } from "lucide-react";
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

const BranchAccessDocs = () => (
  <div className="space-y-8">
    <section id="branch-access" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Branch Access Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how branch access works in UnivoHR and how to configure
            which users can view and manage data for specific branches. This
            is essential for multi-branch companies where each user should
            only see the branches they are responsible for.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">System Administrator</Badge>
              <Badge variant="outline">After user permissions</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">When to use this guide</h3>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Multi-branch setup</strong> — when you have multiple
                  branches and need to restrict access per user.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>User reorganization</strong> — when a user's branch
                  responsibilities change.
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">
                Understanding branch access
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Branch access controls which company locations a user can view
              and manage data for. Here is how it works:
            </p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground ml-4">
              <li className="list-disc">
                <strong>Admin users</strong> — automatically have access to
                all branches. No branch restriction applies.
              </li>
              <li className="list-disc">
                <strong>Non-admin users</strong> — can only see data for
                branches they have been assigned to. This affects Payroll,
                Attendance, Reports, Employees, and other branch-filtered
                modules.
              </li>
              <li className="list-disc">
                <strong>Automatic assignment</strong> — when an employee's
                branch is updated, the corresponding user account's branch
                access is updated automatically.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                How branch access is managed
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Branch access is linked to employee records.</strong>{" "}
                When you create or edit an employee in{" "}
                <strong>Employees</strong> and assign a{" "}
                <strong>Branch</strong>, the corresponding user account (if
                one exists) automatically receives access to that branch.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Branch access affects data visibility.</strong> Users
                will only see data filtered to their assigned branches in the
                following areas:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>Attendance records and reports</li>
                  <li>Payroll data and generation</li>
                  <li>Employee lists filtered by branch</li>
                  <li>Devices assigned to specific branches</li>
                  <li>Calendar events by branch</li>
                  <li>Reports and analytics</li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Check current branch access.</strong> You can verify a
                user's branch access by checking which branches they can view
                when logged in. Non-admin users will only see their assigned
                branches in dropdown filters and data tables.
              </li>
            </ol>
          </div>

          <Separator />

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                Important notes
              </h3>
            </div>
            <ul className="space-y-1 text-sm text-blue-800/90 dark:text-blue-300/90">
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>No manual assignment UI:</strong> Currently, branch
                  access is managed automatically through employee branch
                  assignments. There is no separate interface to manually
                  add or remove branch access for a user.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Update employee branch to change access:</strong>{" "}
                  To add or remove a user's branch access, edit the
                  corresponding employee record and change their Branch
                  field.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Admin users see all branches:</strong> Users with
                  the ADMIN role are not subject to branch access
                  restrictions.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Permission needed for branch management:</strong> To
                  manage branches and assign employees to them, you need the{" "}
                  <strong>branches.manage</strong> permission.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/branch-access" />
  </div>
);

export default BranchAccessDocs;
