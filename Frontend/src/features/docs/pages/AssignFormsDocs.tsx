import { CheckCircle2, ClipboardList, Users } from "lucide-react";
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

const AssignFormsDocs = () => (
  <div className="space-y-8">
    <section id="assign-forms" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Assign Forms Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Assign HR forms to employees or departments, set due dates, and
            track completion status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">
                Who should use this
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">HR Admin</Badge>
              <Badge variant="outline">After form templates + employees</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Assigning a form to employees
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open Form Assignments.</strong> From the sidebar,
                click <strong>HR Forms</strong> then{" "}
                <strong>Assignments</strong>, or click the{" "}
                <strong>Assignments</strong> button from the HR Forms list.
                The page subtitle:{" "}
                <em>Assign forms to employees</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Assign Form.</strong> The{" "}
                <strong>Assign Form to Employees</strong> dialog opens.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select a Form</strong> from the dropdown.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set Due Date</strong> — optional deadline for
                completion.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select Employees</strong> using the employee picker
                table. Search by name, code, or department. Use checkboxes
                to select individual employees, or click{" "}
                <strong>Select visible</strong> to select the current page.
              </li>
              <li className="leading-relaxed pl-1">
                For large groups, click{" "}
                <strong>Assign to all matching (N)</strong> to assign to
                every employee matching the current search.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Assign to N employee(s)</strong>. A summary
                shows how many were created and how many were skipped (e.g.,
                if already assigned).
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Viewing assignment status
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                The assignments table shows: Employee name/code, Department,
                Form title, Assigned Date, Due Date, Status badge, Submitted
                date.
              </li>
              <li className="leading-relaxed pl-1">
                Statuses: <strong>Pending</strong> (not yet started),{" "}
                <strong>Submitted</strong> (completed),{" "}
                <strong>Reviewed</strong> (HR has reviewed).
              </li>
              <li className="leading-relaxed pl-1">
                Search by employee name to find specific assignments.
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/assign-forms" />
  </div>
);

export default AssignFormsDocs;
