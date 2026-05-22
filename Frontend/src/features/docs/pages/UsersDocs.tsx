import { AlertTriangle, Info, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DocScreenshot from "../components/DocScreenshot";
import DocsNavigation from "../components/DocsNavigation";

const UsersDocs = () => (
  <div className="space-y-8">
    <section id="users" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">User accounts (Accounts)</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            The <strong>Accounts</strong> page (User Accounts) lets Administrators
            create login credentials, assign roles, and remove accounts. Each user
            must be linked to one <strong>employee record</strong>. Roles control
            which menus and actions appear across attendance, leave, payroll, and
            settings.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Users overview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Open <strong>Accounts</strong> from the sidebar (Administrator only).
              The page lists usernames with linked employee name, code, role,
              department, and account creation date.
            </p>
            <p className="text-sm text-muted-foreground">
              This is not the same as the <strong>Profile</strong> page employees use
              to view their own HR information. Accounts are for system login only.
            </p>

            <DocScreenshot
              src="/docs/screenshots/users-management.png"
              alt="User management page"
            />
          </div>

          <Separator />

          {/* Roles */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">User roles</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When creating or editing a user, choose one role. There is no
              separate permissions screen — access is driven by the role:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-1">
              <li>
                <strong>Admin</strong> — full access including Employees,
                Accounts, System Settings, and administrator leave tools
              </li>
              <li>
                <strong>HR Admin</strong> — broad HR access (payroll admin view,
                employee add/edit, leave credits, settings with HR Admin access)
              </li>
              <li>
                <strong>HR</strong> — HR operations such as approving requests and
                viewing company data (no Employees/Accounts menu)
              </li>
              <li>
                <strong>Employee</strong> — self-service: own attendance, leaves,
                payroll view, profile, overtime, man hours
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              <strong>Impact:</strong> Changing a user&apos;s role immediately
              changes what they can open and approve. Pair role changes with
              Settings → Approvals when someone should approve leave or overtime for
              others.
            </p>

            <DocScreenshot
              src="/docs/screenshots/users-role-settings.png"
              alt="User role selection in account form"
            />
          </div>

          <Separator />

          {/* Search */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Search and filters</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1">
              <li>
                Search by <strong>username</strong> or <strong>employee name</strong>
              </li>
              <li>
                Filter by role: All, Admin, HR Admin, HR, or Employee
              </li>
              <li>Clear Filters and Refresh reset the table</li>
              <li>Pagination at the bottom (5, 10, 25, 50 rows per page)</li>
            </ul>
          </div>

          <Separator />

          {/* Create */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Creating user accounts</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Ensure the person already exists under <strong>Employees</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Add User</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Select <strong>Employee</strong> — only employees without an
                existing account are listed.
              </li>
              <li className="leading-relaxed pl-1">
                Enter <strong>Username</strong> (required, must be unique).
              </li>
              <li className="leading-relaxed pl-1">
                Enter <strong>Password</strong> and <strong>Confirm Password</strong>{" "}
                (required for new users; minimum 4 characters).
              </li>
              <li className="leading-relaxed pl-1">
                Choose <strong>Role</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Create User</strong>.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              If no employees appear in the list, add an employee first — the form
              offers a link to go to Employees.
            </p>
          </div>

          <Separator />

          {/* Edit */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Editing user accounts</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Click the <strong>pencil</strong> icon on a row.
              </li>
              <li className="leading-relaxed pl-1">
                Update <strong>Username</strong> and/or <strong>Role</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                To change password, enter a new password and confirm it. Leave
                password fields blank to keep the current password.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Save Changes</strong>.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              You cannot reassign a user to a different employee when editing —
              only username, role, and password change.
            </p>
          </div>

          <Separator />

          {/* Delete / activation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Managing user access</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1">
              <li>
                <strong>Delete</strong> — trash icon removes the user account after
                you confirm. The employee record remains.
              </li>
              <li>
                There is no <strong>Active / Inactive</strong> toggle — use delete
                to revoke login access, or change the password on edit.
              </li>
              <li>
                There is no <strong>Reset password</strong> button on this page —
                administrators set a new password in Edit User, or the employee may
                use the login <strong>forgot password</strong> flow if your company
                enabled it.
              </li>
            </ul>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">User permissions</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Only <strong>Administrator</strong> can open Accounts and perform
              create, edit, or delete. HR Admin, HR, and Employee roles do not see
              this menu.
            </p>
            <p className="text-sm text-muted-foreground">
              Fine-grained permission checkboxes are not used — role alone defines
              access. Approver rights for a specific employee are configured under
              System Settings → Approvals, not on the Accounts page.
            </p>
          </div>

          <Separator />

          {/* Needs confirmation */}
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
              Needs confirmation
            </p>
            <ul className="space-y-2 text-sm text-purple-900/90 dark:text-purple-300/90 list-disc list-inside ml-1">
              <li>
                Whether your organization uses the login forgot-password / OTP reset
                flow for employees (separate from Accounts).
              </li>
              <li>
                Policy for deleting vs disabling accounts when someone leaves the
                company.
              </li>
            </ul>
          </div>

          {/* Important notes */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                Important notes
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-blue-800/90 dark:text-blue-300/90">
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  One employee should have at most one user account in normal use.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Give HR Admin or HR roles only to staff who should see company-wide
                  HR data.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  After role changes, ask the user to sign out and sign in again if
                  menus look incorrect.
                </span>
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                User troubleshooting
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-amber-900/90 dark:text-amber-300/90">
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Username already exists</strong> — Choose a different
                  username.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Passwords do not match</strong> — Re-enter password and
                  confirm password identically.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Password must be at least 4 characters</strong> — Use a
                  longer password if your policy requires it (minimum in form is 4).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>No employees available</strong> — Add the employee record
                  first, or the person may already have an account.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot open Accounts</strong> — Only Administrator role
                  has access.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>User deleted but still in list</strong> — Refresh the page;
                  confirm deletion completed without an error message.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/users" />
  </div>
);

export default UsersDocs;
