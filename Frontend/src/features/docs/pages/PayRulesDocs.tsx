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

const PayRulesDocs = () => (
  <div className="space-y-8">
    <section id="pay-rules" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Pay Rules Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to configure pay rate multipliers in UnivoHR. Pay Rules
            define how much an employee earns per day based on the type of day
            worked — regular workday, rest day, special holiday, or regular
            holiday. Correct multiplier setup ensures accurate payroll
            calculations.
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
              <Badge variant="outline">After calendar setup</Badge>
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
                  <strong>First-time company setup</strong> — set the pay
                  multipliers for each day type before running the first
                  payroll.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>After calendar holidays are added</strong> — the day
                  types you set in the calendar (Regular Holiday, Special
                  Holiday, etc.) need corresponding multiplier values here.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>When pay policies change</strong> — for example, if
                  the company decides to increase the rest day multiplier from
                  1.3x to 1.5x.
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
                  Successfully logged in and added holidays to the calendar
                  (see <strong>Calendar and Holiday Setup Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  A list of the multiplier values your company uses for each
                  day type (check with HR or Payroll for the correct rates)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  The <strong>payroll.settings</strong> permission (your
                  account must have access to the Pay Rules tab)
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">
                Understanding pay multipliers
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A pay multiplier is the factor that is applied to the
              employee's daily rate when they work on a specific day type.
              For example:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground ml-4">
              <li className="list-disc">
                <strong>1.0x</strong> (Regular Day) — employee earns their
                standard daily rate
              </li>
              <li className="list-disc">
                <strong>2.0x</strong> (Regular Holiday) — employee earns
                double their daily rate, common for public holidays
              </li>
              <li className="list-disc">
                <strong>1.3x</strong> (Rest Day) — employee earns 30% more
                than their daily rate for working on a rest day
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Configuring pay rules
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open System Settings.</strong> From the sidebar menu on
                the left, click <strong>Settings</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Pay Rules tab.</strong> Click the{" "}
                <strong>Pay Rules</strong> tab. The{" "}
                <strong>Pay Rate Multipliers</strong> card appears. If no
                rules exist yet, the table shows:{" "}
                <em>No pay rules found. Create your first rule.</em>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Add a pay rule.</strong> Click the{" "}
                <strong>Add Rule</strong> button. The{" "}
                <strong>Add Pay Rule</strong> dialog opens with a description:{" "}
                <em>Configure the pay multiplier for different day types.</em>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select Day Type.</strong> Open the{" "}
                <strong>Day Type</strong> dropdown and choose one of:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li><strong>Regular Day</strong> — normal working day</li>
                  <li><strong>Special Non-Working Day</strong> — special non-working day</li>
                  <li><strong>Special Holiday</strong> — special holiday</li>
                  <li><strong>Regular Holiday</strong> — regular public holiday</li>
                  <li><strong>Rest Day</strong> — employee rest day</li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the multiplier.</strong> In the{" "}
                <strong>Multiplier</strong> field, type the pay factor (e.g.,
                <strong>1.0</strong> for regular day, <strong>2.0</strong> for
                regular holiday). The placeholder shows{" "}
                <em>e.g., 1.3</em> and the helper text says{" "}
                <em>Multiply the daily rate by this factor</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save the rule.</strong> Click the <strong>Save</strong>{" "}
                button. A green message says{" "}
                <strong>Pay rule created successfully</strong>. The new rule
                appears in the table showing the day type label and the
                multiplier in the format <em>1.0x</em>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Add rules for each day type.</strong> Repeat steps 3–6
                for each remaining day type. Most companies configure at
                minimum: Regular Day (1.0x), Regular Holiday (2.0x), and Rest
                Day (1.3x or as company policy dictates).
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Editing or deleting a pay rule
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Edit a rule.</strong> In the table, click the{" "}
                <strong>Edit</strong> icon (blue) next to the rule. The{" "}
                <strong>Edit Pay Rule</strong> dialog opens with the current
                values pre-filled.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Update the multiplier.</strong> Change the value as
                needed, then click <strong>Save</strong>. A green message says{" "}
                <strong>Pay rule updated successfully</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Delete a rule.</strong> Click the <strong>Delete</strong>{" "}
                icon (red). A confirmation prompt says{" "}
                <em>Are you sure you want to delete this pay rule?</em>. Click
                <strong>OK</strong> to confirm. A green message says{" "}
                <strong>Pay rule deleted successfully</strong>.
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
                  <strong>One rule per day type:</strong> You can only have one
                  multiplier per day type. If you try to add a duplicate, you
                  should edit the existing rule instead.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Multiplier must be greater than 0:</strong> The
                  minimum multiplier is 0.01. A value of 0 will show a
                  validation error.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Pay Rules vs Payroll Rules:</strong> Pay Rules
                  (this page) set the base multipliers per day type. Payroll
                  Rules (separate tab) handle night differential, holiday-on-rest-day
                  methods, and unworked holiday policies.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Check with Payroll:</strong> Always confirm the
                  multiplier values with your Payroll or HR team before
                  changing them, as these directly affect employee pay.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If pay rule setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Multiplier must be greater than 0</strong> — Enter a
                  value of 0.01 or higher.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Pay Rules tab not visible</strong> — Your account
                  may not have the <strong>payroll.settings</strong> permission.
                  Contact an Administrator.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Changes not appearing in payroll</strong> — Pay
                  Rules apply to payroll runs that start <em>after</em> the
                  rule is saved. Existing payroll periods are not affected.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/pay-rules" />
  </div>
);

export default PayRulesDocs;
