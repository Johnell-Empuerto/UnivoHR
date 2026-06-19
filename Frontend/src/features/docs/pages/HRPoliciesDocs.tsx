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

const HRPoliciesDocs = () => (
  <div className="space-y-8">
    <section id="hr-policies" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">HR Policies Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to create, publish, and manage company HR policies in
            UnivoHR. Policies are company documents such as attendance rules,
            leave policies, or code of conduct that employees can view from
            their dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">HR Admin</Badge>
              <Badge variant="outline">After branch access setup</Badge>
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
                  <strong>First-time setup</strong> — publish company-wide HR
                  policies so all employees can access them.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Policy updates</strong> — when policies change,
                  update or create new versions.
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding a policy
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open HR Policies.</strong> From the sidebar, click{" "}
                <strong>HR Policies</strong>. The page opens showing{" "}
                <strong>HR Policies</strong> with the subtitle:{" "}
                <em>Manage company policies and HR documents</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click the Add button.</strong> Look for the add
                button (usually at the top right of the All Policies card).
                The <strong>Add Policy</strong> dialog opens.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the title.</strong> In the{" "}
                <strong>Title *</strong> field, type the policy name
                (placeholder: <em>e.g., Attendance Policy</em>).
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select a category.</strong> Open the{" "}
                <strong>Category *</strong> dropdown and choose one of:{" "}
                <strong>Attendance</strong>, <strong>Leave</strong>,{" "}
                <strong>Overtime</strong>, <strong>Security</strong>,{" "}
                <strong>Payroll</strong>, or <strong>Privacy</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Write the content.</strong> In the rich text editor,
                compose the policy document. The editor supports: Bold,
                Italic, Underline, Heading 1, Heading 2, Bullet List,
                Numbered List, Align Left/Center/Right, Text Color,
                Highlight, Link, Insert Table, Undo, and Redo.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save the policy.</strong> Click{" "}
                <strong>Create Policy</strong>. A green message says{" "}
                <strong>Policy created</strong>. The policy appears in the
                table with its title, category, and content preview.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing policies
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Search and filter.</strong> Use the{" "}
                <strong>Search policies...</strong> field,{" "}
                <strong>All Categories</strong> dropdown, and{" "}
                <strong>All Status</strong> dropdown to find policy.
              </li>
              <li className="leading-relaxed pl-1">
                The table shows: Title, Category (color-coded), Content
                preview, Status (Active/Inactive badge), and Actions.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Edit a policy.</strong> Click the{" "}
                <strong>Edit</strong> icon. Update title, category, or
                content, then click <strong>Save Changes</strong>. A green
                message says <strong>Policy updated</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Activate or deactivate.</strong> Click the{" "}
                <strong>Activate</strong> or <strong>Deactivate</strong>{" "}
                button to toggle the policy's visibility to employees.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Delete a policy.</strong> Click the{" "}
                <strong>Delete</strong> icon. A dialog says{" "}
                <em>Are you sure you want to delete policy title? This
                action cannot be undone.</em> Click{" "}
                <strong>Delete</strong> to confirm.
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
                  <strong>Active policies are visible to all employees:</strong>{" "}
                  Only policies with Active status are shown on employee
                  dashboards.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Title, category, and content are required:</strong>{" "}
                  All three must be filled before the policy can be saved.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Permission needed:</strong> You need the{" "}
                  <strong>hr_policies.manage</strong> permission to create,
                  edit, or delete policies.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/hr-policies" />
  </div>
);

export default HRPoliciesDocs;
