import { Info, Shield, Users } from "lucide-react";
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

const UserPermissionsDocs = () => (
  <div className="space-y-8">
    <section id="user-permissions" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            User Permissions Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to grant or revoke system permissions for each user in
            UnivoHR. Permissions control what features, pages, and actions
            each user can access. Administrator users automatically have all
            permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Administrator</Badge>
              <Badge variant="outline">After user account setup</Badge>
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
                  <strong>After creating user accounts</strong> — configure
                  what each user can access in the system.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Role changes</strong> — when an employee's
                  responsibilities change, update their permissions.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>New features added</strong> — grant access to newly
                  added system features for existing users.
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing user permissions
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open User Permissions.</strong> From the sidebar,
                click <strong>User Permissions</strong>. The page opens with
                the title <strong>User Permissions</strong> and the
                description:{" "}
                <em>Grant or revoke permissions for each user. Admin users
                automatically have all permissions.</em>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select a user.</strong> In the{" "}
                <strong>Select User</strong> card, open the dropdown (default:{" "}
                <em>Choose a user to manage permissions</em>) or type in the
                search field (placeholder:{" "}
                <strong>Search users...</strong>) to find a user.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Admin users are locked.</strong> If the selected user
                has the <strong>ADMIN</strong> role, a blue info banner says:{" "}
                <em>This user has the ADMIN role and automatically has all
                permissions. Permission controls are disabled for admin
                users.</em>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Use Quick Presets (optional).</strong> Under the{" "}
                <strong>Quick Presets</strong> card, click a preset button to
                quickly assign a standard permission set:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li><strong>Employee Default</strong></li>
                  <li><strong>HR Staff</strong></li>
                  <li><strong>Payroll Staff</strong></li>
                  <li><strong>Supervisor</strong></li>
                  <li><strong>IT Staff</strong></li>
                  <li><strong>Full Access</strong></li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Customize individual permissions.</strong> In the{" "}
                <strong>Permissions</strong> card, permissions are grouped by
                module (e.g., Dashboard, Employees, Attendance, Leave, etc.).
                Each group shows a count like{" "}
                <em>selectedCount/totalCount</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Search for a permission.</strong> Use the{" "}
                <strong>Search permissions...</strong> field to find specific
                permissions by name.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Toggle permissions on or off.</strong> Each permission
                has a checkbox. Checked means the user has that permission.
                Unchecked means they do not.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Reset to default.</strong> Click the{" "}
                <strong>Reset</strong> button to restore the user's
                permissions to the system default.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save changes.</strong> Click the{" "}
                <strong>Save</strong> button to apply all changes.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">
                Common permission categories
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              Permissions are organized by module. Some key permission
              categories include:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Dashboard</p>
                <p className="text-xs text-muted-foreground mt-0.5">View Dashboard</p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Employees</p>
                <p className="text-xs text-muted-foreground mt-0.5">View, Create, Edit, Delete</p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Attendance</p>
                <p className="text-xs text-muted-foreground mt-0.5">View, View Own, Manage, Approve Time Requests</p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Leave</p>
                <p className="text-xs text-muted-foreground mt-0.5">View, Create, Manage, Approve, Credits</p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Payroll</p>
                <p className="text-xs text-muted-foreground mt-0.5">View, Generate, Mark Paid, Settings, Salary, Deductions</p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Settings</p>
                <p className="text-xs text-muted-foreground mt-0.5">View, System, Attendance Rules, Approvals, Branding</p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Reports</p>
                <p className="text-xs text-muted-foreground mt-0.5">View, Employee, Attendance, Leave, Payroll Reports</p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="font-medium">Devices</p>
                <p className="text-xs text-muted-foreground mt-0.5">View, Manage, View Device Logs</p>
              </div>
            </div>
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
                  <strong>Admin users bypass permissions:</strong> Users with
                  the ADMIN role automatically have access to everything.
                  Their permission controls are disabled.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Changes take effect immediately:</strong> After
                  saving, the user's access is updated for their next
                  interaction with the system.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Presets are starting points:</strong> Quick Presets
                  set a baseline set of permissions. You can further customize
                  individual checkboxes after applying a preset.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Permission required:</strong> You need the{" "}
                  <strong>users.manage</strong> permission to access the User
                  Permissions page.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/user-permissions" />
  </div>
);

export default UserPermissionsDocs;
