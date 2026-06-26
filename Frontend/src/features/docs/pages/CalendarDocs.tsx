import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DocsNavigation from "../components/DocsNavigation";

const CalendarDocs = () => (
  <div className="space-y-8">
    <section id="calendar" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Calendar</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            The <strong>Calendar Management</strong> screen shows your
            company&apos;s working days, holidays, and special non-working days
            in a monthly view. HR and payroll teams use it to set how each date
            is treated for pay. All staff can view the calendar to plan leave and
            see upcoming holidays.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <Separator />

          {/* Day types */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Understanding day types</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each date can be labeled with one of four types. Colored bars on
              the calendar match the legend on the right.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>
                <span className="inline-block w-3 h-3 rounded bg-emerald-500 align-middle mr-2" />
                <strong className="text-foreground">Regular Day</strong> — normal
                working day (short label: RD)
              </li>
              <li>
                <span className="inline-block w-3 h-3 rounded bg-red-600 align-middle mr-2" />
                <strong className="text-foreground">Regular Holiday</strong> —
                standard public holiday (RH)
              </li>
              <li>
                <span className="inline-block w-3 h-3 rounded bg-orange-500 align-middle mr-2" />
                <strong className="text-foreground">Special Holiday</strong> —
                special holiday classification (SH)
              </li>
              <li>
                <span className="inline-block w-3 h-3 rounded bg-yellow-500 align-middle mr-2" />
                <strong className="text-foreground">Special Non-Working</strong>{" "}
                — non-working day that is not a regular holiday (SNW)
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              A <strong>paid</strong> day is marked with a money indicator on the
              calendar event. Use the <strong>Paid Day</strong> switch when
              adding or editing a date.
            </p>
          </div>

          <Separator />

          {/* View - everyone */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                View the calendar (all users)
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Sign in and open <strong>Calendar</strong> from the left menu.
              </li>
              <li className="leading-relaxed pl-1">
                Use <strong>Today</strong>, the arrow buttons, or the month/year
                picker at the top of the calendar to change months.
              </li>
              <li className="leading-relaxed pl-1">
                Read colored events on each date. Today&apos;s date is
                highlighted in light blue.
              </li>
              <li className="leading-relaxed pl-1">
                Click any date to update the <strong>Legend &amp; Information</strong>{" "}
                panel on the right. It shows the selected date, day type, paid or
                unpaid status, and description when one exists.
              </li>
            </ol>

            

            
          </div>

          <Separator />

          {/* Add / edit */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">
              Add or edit a holiday / special day (users with the required permissions)
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you can manage the calendar, the header says &quot;Manage
              holidays, special days, and working days for payroll
              calculations.&quot; You will also see action buttons at the top
              right.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Quick add:</strong> Click <strong>Add Special Day</strong>{" "}
                to open the form for today&apos;s date, or click any date on the
                monthly grid (or click an existing colored event).
              </li>
              <li className="leading-relaxed pl-1">
                In the <strong>Add Calendar Day</strong> or{" "}
                <strong>Edit Calendar Day</strong> window, confirm the date
                shown at the top.
              </li>
              <li className="leading-relaxed pl-1">
                Choose <strong>Day Type</strong> (Regular Day, Special
                Non-Working Day, Special Holiday, or Regular Holiday).
              </li>
              <li className="leading-relaxed pl-1">
                Turn <strong>Paid Day</strong> on or off as needed.
              </li>
              <li className="leading-relaxed pl-1">
                Optionally enter a <strong>Description</strong> (for example,
                &quot;Christmas Day&quot; or &quot;Company anniversary&quot;).
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Create</strong> or <strong>Update</strong>. The
                calendar refreshes for the current month.
              </li>
              <li className="leading-relaxed pl-1">
                To remove a day, open it for editing and click{" "}
                <strong>Delete</strong> (available to users who have delete
                access).
              </li>
            </ol>

            
          </div>

          <Separator />

          {/* Bulk upload */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">
              Bulk upload many dates (users with the required permission)
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use bulk upload when you need to load a full year of holidays or
              import many dates from a spreadsheet. The <strong>Bulk Upload</strong>{" "}
              button appears for users with upload access.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Click <strong>Download Template</strong> (or download from inside
                the bulk upload window) to get an Excel file with sample rows and
                an Instructions sheet.
              </li>
              <li className="leading-relaxed pl-1">
                Fill in columns: <strong>Date</strong>, <strong>Type</strong>,{" "}
                <strong>Paid</strong> (optional), <strong>Description</strong>{" "}
                (optional, up to 500 characters). Accepted types: Regular,
                Special Non-Working, Regular Holiday, Special Holiday (short codes
                like RH or SH also work).
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Bulk Upload</strong>, then upload an Excel (
                .xlsx, .xls) or CSV file — maximum <strong>1,000 rows</strong> per
                file. You can drag and drop the file into the upload area.
              </li>
              <li className="leading-relaxed pl-1">
                Choose <strong>Overwrite existing data</strong> if you want
                matching dates updated; leave it off to skip dates that already
                exist.
              </li>
              <li className="leading-relaxed pl-1">
                Review the <strong>Bulk Upload Results</strong> summary:
                inserted, updated, and failed counts, plus any error messages
                per row.
              </li>
            </ol>

            
          </div>

          <Separator />

          {/* Important notes */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                Important notes
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  The calendar shows one <strong>month at a time</strong> (month
                  grid view).
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  If you try to add a date that already exists, you will be asked
                  to edit the existing entry instead of creating a duplicate.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  When editing a day, you change type, paid status, and
                  description — the date itself is fixed to the day you clicked.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Dates in bulk files support common formats (for example
                  YYYY-MM-DD or MM/DD/YYYY). Invalid rows are listed in the
                  results and skipped.
                </span>
              </li>
            </ul>
          </div>

          {/* Tips & warnings */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-sm text-foreground mb-3">
              Tips &amp; warnings
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-amber-600 shrink-0">⚠</span>
                <span>
                  Plan holiday updates <strong>before</strong> payroll is
                  generated for that period to avoid incorrect pay.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">✓</span>
                <span>
                  Use clear descriptions (holiday names) so employees understand
                  events on the calendar.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">✓</span>
                <span>
                  After bulk upload, scroll the calendar to the correct month to
                  verify colors and labels.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 shrink-0">⚠</span>
                <span>
                  Turning on <strong>Overwrite</strong> during bulk upload will
                  replace data for dates that already exist. Double-check your
                  file first.
                </span>
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                Troubleshooting
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot click dates</strong> — Your account is view-only.
                  Contact a user with the required permissions to add
                  holidays.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Date already exists</strong> — Click that date (or its
                  event) and use Update instead of creating a new entry.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Bulk upload failed rows</strong> — Open the results
                  dialog, read each error (missing date, wrong type, bad date
                  format), fix the spreadsheet, and upload again.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Wrong file type</strong> — Only Excel (.xlsx, .xls) or
                  CSV files are accepted.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Too many rows</strong> — Split your file into batches
                  of 1,000 rows or fewer.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Delete or bulk upload not working</strong> — You
                  may not have permission. Ask a user with the required permissions to perform the
                  action or adjust access.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Holiday not visible</strong> — Move to the correct
                  month using the month picker or arrow buttons.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/calendar" />
  </div>
);

export default CalendarDocs;
