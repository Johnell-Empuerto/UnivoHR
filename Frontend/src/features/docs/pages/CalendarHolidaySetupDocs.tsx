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

const CalendarHolidaySetupDocs = () => (
  <div className="space-y-8">
    <section id="calendar-holiday-setup" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Calendar and Holiday Setup Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to add holidays and special non-working days to the
            company calendar. The Calendar Management page is used to mark
            which dates have special pay rules so that attendance and payroll
            calculations are correct.
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
              <Badge variant="outline">After rest day setup</Badge>
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
                  <strong>First-time setup</strong> — when populating the
                  calendar with holidays for the current or upcoming year.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Before a new pay period</strong> — ensure all
                  upcoming holidays are configured before payroll runs.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Government-declared holidays change</strong> — update
                  the calendar whenever new holiday dates are announced.
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
                  Successfully logged in and completed rest day settings (see{" "}
                  <strong>Rest Day Settings Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  A list of holidays and special days for the year (regular
                  holidays, special non-working days, special holidays)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Decided which holidays are paid and which are unpaid
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Administrator account access (calendar management requires
                  ADMIN role)
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Understanding day types
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Each date on the calendar has one of four types. Colored bars on
              the calendar grid match the legend on the right panel.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="list-disc">
                <strong>Regular Day</strong> (RD) — normal working day (green)
              </li>
              <li className="list-disc">
                <strong>Regular Holiday</strong> (RH) — standard public
                holiday such as Independence Day or Christmas (red)
              </li>
              <li className="list-disc">
                <strong>Special Holiday</strong> (SH) — special holiday
                classification (orange)
              </li>
              <li className="list-disc">
                <strong>Special Non-Working Day</strong> (SNW) — non-working
                day that is not a regular holiday (yellow)
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              A <strong>Paid Day</strong> is marked with a money indicator on
              the calendar event. Use the <strong>Paid Day</strong> switch when
              adding or editing a date.
            </p>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding a holiday or special day
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open Calendar.</strong> From the sidebar menu on the
                left, click <strong>Calendar</strong>. The{" "}
                <strong>Calendar Management</strong> page opens showing a
                monthly grid.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Navigate to the correct month.</strong> Use the{" "}
                <strong>Today</strong> button, the left and right arrow
                buttons, or the month/year picker at the top of the calendar
                to go to the month containing your holiday date.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Choose how to add:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    Click the <strong>Add Special Day</strong> button (top
                    right) to open the form for today's date, or
                  </li>
                  <li>
                    Click any date directly on the monthly grid to open the{" "}
                    <strong>Add Calendar Day</strong> dialog for that date.
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Confirm the date.</strong> The date appears at the top
                of the dialog in the format{" "}
                <em>MMMM d, yyyy</em> — this is read-only.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set Apply To.</strong> Choose{" "}
                <strong>Global (All Branches)</strong> for company-wide
                holidays, or select a specific branch for a location-only
                holiday.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select Day Type.</strong> Open the <strong>Day Type</strong>{" "}
                dropdown and choose one of:{" "}
                <em>Regular Day, Special Non-Working Day, Special Holiday, Regular Holiday</em>
                .
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Toggle Paid Day.</strong> Turn the <strong>Paid Day</strong>{" "}
                switch on if this is a paid holiday, or off for unpaid.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Add a description.</strong> Enter the holiday name in
                the <strong>Description (Optional)</strong> field (for example,
                "Christmas Day" or "Company anniversary").
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save.</strong> Click the{" "}
                <strong>Create</strong> button. The calendar refreshes and a
                green message says{" "}
                <strong>Calendar day created successfully</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Repeat for each holiday.</strong> Add one entry per
                holiday per date. For multi-day holidays like Holy Week, add
                each date separately.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Editing or removing a calendar day
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Click the event.</strong> On the monthly grid, click
                the event bar for the date you want to edit. The{" "}
                <strong>Edit Calendar Day</strong> dialog opens.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Change the fields.</strong> Update the Day Type, Paid
                Day toggle, Apply To branch, or Description as needed.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save changes.</strong> Click the{" "}
                <strong>Update</strong> button. A green message says{" "}
                <strong>Calendar day updated successfully</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>To remove a day.</strong> Open it for editing and
                click the <strong>Delete</strong> button (red, with Trash
                icon). A green message says{" "}
                <strong>Calendar day deleted successfully</strong>. The Delete
                button is only available to Administrator users.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Bulk uploading many dates
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Use bulk upload when you need to load a full year of holidays or
              import many dates from a spreadsheet.
            </p>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Click <strong>Download Template</strong> to get an Excel file
                with sample rows and an Instructions sheet.
              </li>
              <li className="leading-relaxed pl-1">
                Fill in the columns: <strong>Date</strong>, <strong>Type</strong>,{" "}
                <strong>Paid</strong> (optional),{" "}
                <strong>Description</strong> (optional),{" "}
                <strong>Branch</strong> (optional — leave empty for Global).
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Bulk Upload</strong>. In the{" "}
                <strong>Bulk Upload Calendar Days</strong> dialog, upload your
                Excel (.xlsx, .xls) or CSV file — max 1,000 rows. You can drag
                and drop the file.
              </li>
              <li className="leading-relaxed pl-1">
                Optionally toggle <strong>Overwrite existing data</strong> on
                to update dates that already exist, or leave it off to skip
                them.
              </li>
              <li className="leading-relaxed pl-1">
                Review the <strong>Bulk Upload Results</strong> dialog showing
                Inserted, Updated, Skipped, and Failed counts.
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
                  <strong>Users with the required permission:</strong> Only users with the
                  Administrator role can add, edit, or delete calendar days.
                  HR and Employee accounts are view-only.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Day type determines pay:</strong> How each day type
                  affects pay depends on Pay Rules configured in System
                  Settings. Coordinate with payroll when adding holidays.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Plan ahead:</strong> Add holidays well before the
                  start of each pay period to ensure correct attendance and
                  payroll calculations.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>No duplicates:</strong> If you try to add a date
                  that already exists, the system opens the edit form for the
                  existing entry instead.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If holiday setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot click dates</strong> — Your account is
                  view-only (HR or Employee). Ask an Administrator to add
                  holidays.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Date already exists</strong> — Click that date and
                  use Update instead of trying to create a duplicate.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Bulk upload failed rows</strong> — Open the results
                  dialog, read each error, fix the spreadsheet, and upload
                  again.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Wrong file type</strong> — Only Excel (.xlsx, .xls)
                  or CSV files are accepted.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Too many rows</strong> — Split your file into
                  batches of 1,000 rows or fewer.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/calendar-holiday-setup" />
  </div>
);

export default CalendarHolidaySetupDocs;
