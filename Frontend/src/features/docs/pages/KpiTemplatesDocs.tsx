import { CheckCircle2, FileText, Users } from "lucide-react";
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

const KpiTemplatesDocs = () => (
  <div className="space-y-8">
    <section id="kpi-templates" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">KPI Templates Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Build KPI (Key Performance Indicator) templates that define
            evaluation criteria for employee performance reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">HR Admin</Badge>
              <Badge variant="outline">After employees exist</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Creating a KPI template
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open KPI Templates.</strong> From the sidebar, click{" "}
                <strong>Performance</strong> then{" "}
                <strong>KPI Templates</strong>. The page shows the subtitle:{" "}
                <em>Create and manage performance evaluation templates</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Template.</strong> The{" "}
                <strong>Add Template</strong> dialog opens.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in the details:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Name *</strong> — e.g., Production Operator KPI
                  </li>
                  <li>
                    <strong>Department</strong> — e.g., Production
                  </li>
                  <li>
                    <strong>Description</strong> — optional description
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Create</strong>. The template appears in the
                list with 0 items.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding KPI items (criteria)
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Click the <strong>Manage Items</strong> icon (file icon) on
                a template row. The <strong>KPI Items</strong> dialog opens.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Add Item</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>KPI Name *</strong> — e.g., Attendance
                  </li>
                  <li>
                    <strong>Weight (%)</strong> — percentage weight (0-100)
                  </li>
                  <li>
                    <strong>Description</strong> — optional details
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Add</strong>. The item appears in the list.
              </li>
              <li className="leading-relaxed pl-1">
                The total weight is shown at the top. Aim for 100%. A green
                label shows "balanced", amber shows "under 100%", and red
                shows "exceeds 100%".
              </li>
              <li className="leading-relaxed pl-1">
                Edit or delete items using the pencil and trash icons.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing templates
              </h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Search templates by name. The table shows: Name, Department,
                Items count, Status badge (Active/Inactive).
              </li>
              <li className="leading-relaxed pl-1">
                Toggle Active/Inactive using the toggle button.
              </li>
              <li className="leading-relaxed pl-1">
                Edit with the pencil icon. Delete with the trash icon (also
                removes all associated items).
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/kpi-templates" />
  </div>
);

export default KpiTemplatesDocs;
