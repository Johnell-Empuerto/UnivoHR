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

const DashboardDocs = () => (
  <div className="space-y-8">
    <section id="dashboard" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Dashboard</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Your home screen after login. What you see depends on your role:
            users with admin permissions get a company-wide overview; most employees and
            HR staff see personal attendance, leave balance, and shortcuts to
            common tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who can use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">All signed-in users</Badge>
              <Badge variant="outline">Admin view: users with the required permissions</Badge>
              <Badge variant="outline">Personal view: users with self-service permissions</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Step-by-step guide</h3>
            </div>
            <p className="text-sm font-medium text-foreground mb-2">
              For most employees and users with self-service permissions
            </p>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground mb-4">
              <li className="leading-relaxed pl-1">
                After login, open <strong>Dashboard</strong> from the left menu.
              </li>
              <li className="leading-relaxed pl-1">
                Review <strong>Today&apos;s Attendance</strong> — your status,
                check-in time, and check-out time for the current day.
              </li>
              <li className="leading-relaxed pl-1">
                Check the summary cards for <strong>Present</strong>,{" "}
                <strong>Late</strong>, <strong>Absent</strong>, and{" "}
                <strong>Leave</strong> days this month.
              </li>
              <li className="leading-relaxed pl-1">
                View <strong>Leave Balance</strong> (sick, vacation, emergency,
                maternity) and your <strong>Recent Leave Requests</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Use <strong>Quick Actions</strong> to jump to Attendance, Leaves,
                Profile, or Payroll.
              </li>
            </ol>
            <p className="text-sm font-medium text-foreground mb-2">
              For users with the required permissions
            </p>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Open <strong>Dashboard</strong> to see company-wide counts:
                Present Today, Late Today, Absent Today, and On Leave Today.
              </li>
              <li className="leading-relaxed pl-1">
                Review charts such as daily breakdown, weekly trends, employee
                growth, and absent trends.
              </li>
              <li className="leading-relaxed pl-1">
                Read the <strong>Insights</strong> panel for helpful summaries.
              </li>
              <li className="leading-relaxed pl-1">
                Use the sidebar to open Attendance, Leaves, Payroll, or other
                modules you manage.
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
            <ul className="space-y-1.5">
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  The bell icon in the top bar opens <strong>Notifications</strong>{" "}
                  for alerts such as leave and payroll updates.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Leave balances on the dashboard reflect credits assigned by HR;
                  approved leave updates your remaining days.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Users without admin permissions see the personal dashboard, not the
                  company admin overview.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                Common errors & troubleshooting
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Numbers look outdated</strong> — Refresh the page or log
                  out and back in. Data updates when attendance and leave are
                  processed.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>No leave balance shown</strong> — Your HR team may not
                  have assigned leave credits yet. Contact HR.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Today shows no check-in</strong> — See Attendance
                  documentation. Check-in may be recorded through your
                  company&apos;s time clock or device, not on this screen.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/dashboard" />
  </div>
);

export default DashboardDocs;
