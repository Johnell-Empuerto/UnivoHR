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

const RestDaySettingsDocs = () => (
  <div className="space-y-8">
    <section id="rest-day-settings" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Rest Day Settings Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to configure rest day settings in UnivoHR. Rest days
            identify which days of the week are non-regular workdays. Correct
            rest day setup is essential for overtime computation, rest day pay,
            holiday-on-rest-day rules, and payroll accuracy.
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
              <Badge variant="secondary">Administrator — permission</Badge>
              <Badge variant="secondary">Client Admin</Badge>
              <Badge variant="outline">After shift setup</Badge>
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
                  <strong>After Shift Settings</strong> — configure rest days
                  before setting up holidays and processing payroll.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Before payroll processing</strong> — rest day work,
                  overtime on rest days, and holidays on rest days all depend
                  on correct rest day setup.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>When company rest day schedules change</strong> —
                  update branch or employee rest days as needed.
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
                  Successfully logged in and finished shift settings (see{" "}
                  <strong>Shift Settings Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Created branches (see <strong>Branch Setup Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Decided which days of the week are rest days for each branch
                  (e.g., Sunday only, or Saturday and Sunday)
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Configuring branch rest days
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Branch rest days are the default rest day schedule for all
              employees assigned to a branch, unless overridden at the employee
              level.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open System Settings.</strong> From the sidebar menu on
                the left, click <strong>Settings</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Rest Days tab.</strong> Click the{" "}
                <strong>Rest Days</strong> tab. The{" "}
                <strong>Branch Rest Days</strong> card appears with a
                description:{" "}
                <em>Configure default rest days per branch. Employees inherit
                their branch's rest days unless individual rest days are
                assigned.</em> Below the card header, a branch filter dropdown
                lets you show rest days for a specific branch (default: All
                Branches).
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Add a rest day entry.</strong> At the top of the card,
                use the two dropdowns to select a <strong>Branch</strong> and a{" "}
                <strong>Rest Day</strong> (day of the week), then click the{" "}
                <strong>Add</strong> button. A green message says{" "}
                <strong>Branch rest day added</strong>. The entry appears in
                the table below.
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    Available days: <strong>Sunday</strong>,{" "}
                    <strong>Monday</strong>, <strong>Tuesday</strong>,{" "}
                    <strong>Wednesday</strong>, <strong>Thursday</strong>,{" "}
                    <strong>Friday</strong>, <strong>Saturday</strong>
                  </li>
                  <li>
                    If a rest day is already configured for the selected branch
                    and day, a message says{" "}
                    <strong>Rest day already configured for this branch</strong>
                    .
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Repeat for each rest day.</strong> Add one entry per
                rest day per branch. For example, if a branch has both Saturday
                and Sunday as rest days, add Saturday first, then add Sunday.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Remove a rest day if needed.</strong> In the table,
                click the <strong>Trash</strong> icon next to a rest day entry
                to remove it. A green message says{" "}
                <strong>Branch rest day removed</strong>.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Configuring employee rest day overrides
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Employees automatically follow their branch's rest days. If an
              employee has a different rest day schedule, you can override it
              from the employee's record.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open the employee record.</strong> From the sidebar,
                click <strong>Employees</strong>. Find the employee and click
                the <strong>Edit</strong> icon.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Find the Rest Day Overrides section.</strong> In the
                employee form, scroll to the{" "}
                <strong>Rest Day Overrides</strong> section. The employee's
                branch default rest days are shown below the heading, and any
                existing overrides are listed as blue badges.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Add an override.</strong> Click the{" "}
                <strong>+ Add</strong> button, select a day from the dropdown,
                and the new rest day appears as a blue badge. A green message
                says <strong>Rest day added</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Remove an override.</strong> Click the{" "}
                <strong>×</strong> button on a badge to remove that rest day
                override. A green message says{" "}
                <strong>Rest day removed</strong>.
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
                  <strong>Branch rest days</strong> are the default for all
                  employees in that branch. Configure these first.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Employee rest day overrides</strong> take priority
                  over branch defaults. Use these only when an employee has a
                  unique schedule.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Incorrect rest day setup can affect{" "}
                  <strong>overtime pay, rest day premiums, and holiday-on-rest-day
                  calculations</strong> in payroll.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Configure rest days <strong>before processing payroll</strong>{" "}
                  to ensure accurate results.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If rest day setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>No branch or day selected</strong> — Both a branch
                  and a day must be selected before clicking Add.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Rest day already configured</strong> — That branch
                  and day combination already exists. Check the table for
                  existing entries.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Permission denied</strong> — Only users with the
                  System Settings permission can manage branch rest days.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Changes did not appear</strong> — Refresh the page or
                  reopen the Rest Days tab.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/rest-day-settings" />
  </div>
);

export default RestDaySettingsDocs;
