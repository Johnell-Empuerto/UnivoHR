import { AlertTriangle, CheckCircle2, Info, ShieldAlert, Users } from "lucide-react";
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

const typeLabels = [
  ["Repeated Late", "Frequent Undertime", "Missing Checkout", "Checkout No Checkin"],
  ["Excessive Overtime", "Overtime Spike", "Absent w/o Leave", "Repeated Time Mod"],
  ["Rejected Time Mod", "Abnormal Leave", "Leave Around Absence", "Rejected Leave→Absence"],
  ["Rejected OT Repeated", "Branch High Absence", "Man-hour Overlap", "Man-hour Excess", "Man-hour Edits", "Payroll Spike"],
];

const AnomaliesDocs = () => (
  <div className="space-y-8">
    <section id="anomalies" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Anomalies Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to use the Anomaly Detection system in UnivoHR.
            Anomalies are rule-based alerts that flag suspicious or unusual
            HR and attendance activity, such as repeated lateness, excessive
            overtime, or missing checkouts. Reviewing and resolving anomalies
            helps ensure accurate attendance and payroll data.
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
              <Badge variant="outline">After attendance management</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Anomaly types
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              The system detects the following types of anomalies:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {typeLabels.flatMap((group) =>
                group.map((type) => (
                  <div
                    key={type}
                    className="px-3 py-2 rounded-lg border border-border/60"
                  >
                    {type}
                  </div>
                ))
              )}
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Viewing and managing anomalies
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open Anomalies.</strong> From the sidebar, click{" "}
                <strong>Anomalies</strong>. The{" "}
                <strong>Anomaly Detection</strong> page opens with the
                description:{" "}
                <em>Rule-based detection of suspicious HR and attendance
                activity</em>. Four summary cards at the top show:{" "}
                <strong>Open Anomalies</strong>,{" "}
                <strong>High Severity</strong>,{" "}
                <strong>Detected Today</strong>, and{" "}
                <strong>Resolved</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Review the Anomaly Logs table.</strong> The table
                shows columns: ID, Employee, Type, Severity (HIGH/MEDIUM/LOW
                with color-coded badges), Status (Open/Reviewed/Resolved),
                Source (module), Detected (date), and Actions.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Filter the list.</strong> Use the dropdowns to filter
                by <strong>Status</strong> (All, Open, Reviewed, Resolved),{" "}
                <strong>Severity</strong> (All, HIGH, MEDIUM, LOW),{" "}
                <strong>Module</strong> (All, Attendance, Overtime, Payroll,
                Leaves, Man Hours, Time Modification), and{" "}
                <strong>Type</strong>. Use the search field to filter by
                employee ID.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>View details.</strong> Click the eye icon (View
                Details) on any row. The{" "}
                <strong>Anomaly Details</strong> drawer shows: Description,
                Detected Value, Expected Value, Employee, Branch, Detected
                At, Source, Reviewed By, and Resolved By.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Change status.</strong> From the detail drawer or the
                table, use the <strong>Mark Reviewed</strong> or{" "}
                <strong>Mark Resolved</strong> buttons to update the
                anomaly's status.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Run a manual scan (optional).</strong> Click{" "}
                <strong>Run Daily Scan</strong> to trigger an immediate
                anomaly detection scan. A green message shows how many
                anomalies were detected.
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
                  <strong>Run daily scans regularly:</strong> Anomalies are
                  detected automatically based on schedules, but you can also
                  run manual scans at any time.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Notification settings affect detection:</strong>{" "}
                  Some anomaly rules can be configured in Settings &gt;
                  Notifications with custom thresholds.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Permission required:</strong> You need the{" "}
                  <strong>anomalies.view</strong> permission to access the
                  Anomalies page.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/anomalies" />
  </div>
);

export default AnomaliesDocs;
