import { AlertTriangle, CheckCircle2, Info, Moon, Calculator, Sun, Users } from "lucide-react";
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

const PayrollRulesDocs = () => (
  <div className="space-y-8">
    <section id="payroll-rules" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Payroll Rules Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to configure advanced payroll rules in UnivoHR. Payroll
            Rules cover night differential pay, how holidays on rest days are
            calculated, and what employees receive for unworked regular
            holidays, special holidays, and special non-working days.
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
              <Badge variant="secondary">Payroll Admin</Badge>
              <Badge variant="outline">After pay rules</Badge>
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
                  <strong>After Pay Rules are set</strong> — Payroll Rules
                  build on the multipliers configured in the Pay Rules tab.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Before first payroll run</strong> — these rules
                  directly affect how employee pay is computed each period.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Policy changes</strong> — when night differential
                  rates, holiday-on-rest-day methods, or unworked day policies
                  need to be updated.
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
                  Completed the <strong>Pay Rules Guide</strong> — pay
                  multipliers are configured for each day type
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Knowledge of your company's policies for night differential,
                  holiday on rest day, and unworked day pay
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  The <strong>payroll.settings</strong> permission to access
                  the Payroll Rules tab
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Configuring night differential
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Night differential is a premium paid for hours worked between
              10:00 PM and 6:00 AM, applied on top of the regular hourly rate.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open System Settings.</strong> Click{" "}
                <strong>Settings</strong> from the sidebar.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Payroll Rules tab.</strong> Click the{" "}
                <strong>Payroll Rules</strong> tab.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Find the Night Differential card.</strong> The card
                (with a <Moon className="h-3 w-3 inline" /> moon icon) says{" "}
                <strong>Night Differential</strong> with a description:{" "}
                <em>Configure night differential pay for hours worked between
                10:00 PM and 6:00 AM.</em>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enable night differential.</strong> Toggle{" "}
                <strong>Enable Night Differential</strong> on. A green message
                says <strong>Night differential enabled</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set the rate.</strong> Enter the percentage premium in
                the <strong>Night Differential Rate</strong> field. For
                example, enter <strong>10</strong> for 10% (meaning hours
                worked between 10PM–6AM are paid at 110% of the regular rate).
                The helper below shows{" "}
                <em>Current: 0.10 (10%)</em>. A green message says{" "}
                <strong>Night differential rate set to 10%</strong>.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Configuring holiday on rest day
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              When a holiday falls on an employee's rest day, you can choose
              how to combine the holiday multiplier and the rest day
              multiplier.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Scroll to the{" "}
                <strong>Holiday on Rest Day</strong> card (with a{" "}
                <Calculator className="h-3 w-3 inline" /> calculator icon).
                The description says:{" "}
                <em>Configure how holiday pay is computed when a holiday falls
                on an employee's rest day.</em>
              </li>
              <li className="leading-relaxed pl-1">
                Open the <strong>Composite Method</strong> dropdown and choose
                one of:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Multiplicative (hol x rd)</strong> — holiday
                    multiplier multiplied by rest day multiplier (e.g., 2.0 ×
                    1.3 = 2.6x)
                  </li>
                  <li>
                    <strong>Additive (hol + rd - 1)</strong> — holiday
                    multiplier plus rest day multiplier minus 1 (e.g., 2.0 +
                    1.3 - 1 = 2.3x)
                  </li>
                  <li>
                    <strong>Max Only (max of hol, rd)</strong> — uses the
                    higher of the two multipliers (e.g., max(2.0, 1.3) =
                    2.0x)
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                A green message confirms your selection, e.g.,{" "}
                <strong>Holiday-on-rest-day method set to Multiplicative (hol
                × rd)</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Note:</strong> This rule only applies{" "}
                <em>when the employee has attendance</em> on the holiday rest
                day. If the employee has no attendance, the Unworked Holiday
                Policy applies instead.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Configuring unworked holiday policies
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              These policies determine what an employee receives when a
              holiday falls on a day they did not work. There are three policy
              cards, one for each holiday type.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Unworked Regular Holiday Policy</strong> (with{" "}
                <Sun className="h-3 w-3 inline" /> sun icon) — applies when
                the calendar day type is{" "}
                <strong>Regular Holiday</strong> and the employee has no
                attendance. Description says:{" "}
                <em>Applies when calendar day_type is REGULAR_HOLIDAY and the
                employee has no attendance. Does not affect leave days.</em>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Unworked Special Holiday Policy</strong> — same
                concept for <strong>Special Holiday</strong> days.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Unworked Special Non-Working Policy</strong> — same
                concept for{" "}
                <strong>Special Non-Working</strong> days.
              </li>
              <li className="leading-relaxed pl-1">
                For each policy, open the dropdown and choose one option:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>No Pay</strong> — employee receives 0x for the
                    unworked holiday
                  </li>
                  <li>
                    <strong>Daily Rate (1x)</strong> — employee receives the
                    standard daily rate
                  </li>
                  <li>
                    <strong>Holiday Rate</strong> — employee receives the full
                    holiday multiplier rate
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                Selecting an option shows a green message, e.g.,{" "}
                <strong>Regular Holiday: Daily Rate (1x)</strong>.
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
                  <strong>All values auto-save</strong> — Changes to
                  toggles, rates, and dropdown selections in Payroll Rules are
                  saved immediately. There is no separate Save button.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Holiday-on-rest-day</strong> only applies when the
                  employee <em>worked</em> on that day. Unworked holiday
                  policies apply when they did not.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Leave days not affected</strong> — Unworked holiday
                  policies only apply to days without attendance. Approved
                  leave days are handled separately.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Coordinate with Payroll:</strong> Confirm all
                  policies with your Payroll team before processing any pay
                  run.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If payroll rule setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Payroll Rules tab not visible</strong> — Your
                  account may not have the{" "}
                  <strong>payroll.settings</strong> permission. Contact your
                  Administrator.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Rate not saving</strong> — Make sure the night
                  differential toggle is enabled before setting the rate.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Changes not reflected in payroll</strong> — Changes
                  apply to future payroll periods, not retroactively.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/payroll-rules" />
  </div>
);

export default PayrollRulesDocs;
