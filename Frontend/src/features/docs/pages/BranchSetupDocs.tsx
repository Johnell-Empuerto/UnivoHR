import { AlertTriangle, CheckCircle2, Info, Users } from "lucide-react";
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

const BranchSetupDocs = () => (
  <div className="space-y-8">
    <section id="branch-setup" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Branch Setup Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to create and manage company branches in UnivoHR.
            Branches organize your company locations and are used throughout
            the system — employees belong to branches, attendance and payroll
            can be filtered by branch, and user access can be limited to
            specific branches.
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
              <Badge variant="secondary">HR Admin</Badge>
              <Badge variant="secondary">Client Admin</Badge>
              <Badge variant="outline">After company branding</Badge>
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
                  <strong>After company branding setup</strong> — create
                  branches before adding employees so each employee can be
                  assigned to the correct location.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Before assigning branch access</strong> — admin users
                  need branches to exist before their access can be limited.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>When the company adds a new site or location</strong>{" "}
                  — create a new branch record for each office, warehouse, or
                  store.
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Before you start</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Make sure you have the following ready:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Successfully logged in and finished company branding (see{" "}
                  <strong>Company Branding Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  List of company branches/sites ready — all physical locations
                  where your company operates
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  A unique branch code for each location (e.g.,{" "}
                  <span className="font-mono">BRN-001</span>,{" "}
                  <span className="font-mono">MNL-MAIN</span>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Branch name and timezone ready for each location
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">How to create a branch</h3>
            </div>
            <ol className="space-y-4 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open the Branches page.</strong> From the sidebar menu
                on the left, click <strong>Branches</strong>. The Branches page
                opens showing a list of existing branches and an{" "}
                <strong>Add Branch</strong> button.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Branch.</strong> Click the{" "}
                <strong>Add Branch</strong> button at the top of the page. A
                dialog box titled <strong>Add Branch</strong> appears.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the Branch Code.</strong> Click the{" "}
                <strong>Branch Code</strong> field and type a unique code for
                the branch (e.g., <span className="font-mono">BRN-001</span>).
                This field is required. Use a short, recognizable code.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the Branch Name.</strong> Click the{" "}
                <strong>Branch Name</strong> field and type the branch name
                (e.g., <span className="font-mono">Makati Branch</span>). This
                field is required. Use the official location name.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the Timezone.</strong> Click the{" "}
                <strong>Timezone</strong> dropdown and choose the correct
                timezone for this branch. The default is{" "}
                <strong>Asia/Manila</strong>. This is optional but recommended
                for accurate attendance and schedule tracking.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the Address (optional).</strong> Click the{" "}
                <strong>Address</strong> field and type the street address
                (e.g., <span className="font-mono">123 Business St.</span>).
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the City (optional).</strong> Click the{" "}
                <strong>City</strong> field and type the city or municipality.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the Province (optional).</strong> Click the{" "}
                <strong>Province</strong> field and type the province or
                region.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the Phone number (optional).</strong> Click the{" "}
                <strong>Phone</strong> field and type the branch contact
                number.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Create Branch.</strong> Click the{" "}
                <strong>Create Branch</strong> button at the bottom of the
                dialog. The system saves the new branch. A green success
                message appears saying <strong>Branch created</strong>. The
                dialog closes and the new branch appears in the list.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">How to edit a branch</h3>
            </div>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Find the branch in the list and click the <strong>Edit</strong>{" "}
                icon (pencil) in the Actions column.
              </li>
              <li className="leading-relaxed pl-1">
                The dialog opens with the title{" "}
                <strong>Edit Branch</strong> and all fields filled with the
                current values.
              </li>
              <li className="leading-relaxed pl-1">
                Change the fields you want to update.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Save Changes</strong>. A green message says{" "}
                <strong>Branch updated</strong>.
              </li>
            </ol>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">How to activate or deactivate a branch</h3>
            </div>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Find the branch in the list. The <strong>Status</strong> column
                shows <strong>Active</strong> or <strong>Inactive</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Click the <strong>Activate</strong> or{" "}
                <strong>Deactivate</strong> icon in the Actions column.
              </li>
              <li className="leading-relaxed pl-1">
                The status updates immediately. A green message says{" "}
                <strong>Branch activated</strong> or{" "}
                <strong>Branch deactivated</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Deactivated branches are hidden from most selection lists but
                their records are kept in the system.
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
                  <strong>Create branches before adding employees.</strong>{" "}
                  Each employee must be assigned to a branch.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Use <strong>clear, unique branch names and codes</strong> to
                  avoid confusion between locations.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Set the correct <strong>timezone</strong> for each branch so
                  attendance, overtime, and schedules are calculated
                  accurately.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Branch access</strong> controls what HR and admin
                  users can manage. Configure this after branches and user
                  accounts exist.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Avoid creating <strong>duplicate branches</strong> for the
                  same physical location.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If branch setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Branch code is missing</strong> — Enter a unique code
                  for the branch. This field is required.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Branch name is missing</strong> — Enter the branch
                  name. This field is required.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Duplicate branch code</strong> — Each branch code
                  must be unique. Use a different code.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Permission denied</strong> — Only users with the
                  Manage Branches permission can create or edit branches.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Changes did not appear</strong> — Refresh the page or
                  reopen the Branches page.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/branch-setup" />
  </div>
);

export default BranchSetupDocs;
