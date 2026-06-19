import { AlertTriangle, Info, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DocsNavigation from "../components/DocsNavigation";

const employeeAccessRows = [
  {
    action: "See Employees in sidebar menu",
    admin: "Yes",
    hrAdmin: "No",
    hr: "No",
    note: "Menu label: Employees",
  },
  {
    action: "Open Employees page and view records",
    admin: "Yes",
    hrAdmin: "Yes",
    hr: "Yes",
    note: "Page can be opened if you have access; sidebar link is Administrator-only",
  },
  {
    action: "Add employee",
    admin: "Yes",
    hrAdmin: "Yes",
    hr: "No",
  },
  {
    action: "Edit employee",
    admin: "Yes",
    hrAdmin: "Yes",
    hr: "No",
  },
  {
    action: "Delete employee",
    admin: "No",
    hrAdmin: "No",
    hr: "No",
    note: "Not available in the app",
  },
];

const EmployeesDocs = () => (
  <div className="space-y-8">
    <section id="employees" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Employees</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            The <strong>Employees</strong> module stores HR records for each person
            in your company: job details, contact information, government IDs, and
            employment status. Employee records are separate from login accounts —
            use <strong>Accounts</strong> (Users) to give someone system access.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Employees overview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Open <strong>Employees</strong> from the sidebar (Administrator menu
              only). You will see a searchable list with filters, then open a side
              panel to view or edit a person&apos;s full record.
            </p>
            <p className="text-sm text-muted-foreground">
              There is no separate full-page employee profile URL — details open in
              a drawer from the list. Employees view their own summary on the{" "}
              <strong>Profile</strong> page (read-only).
            </p>

            
          </div>

          <Separator />

          {/* Viewing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Viewing employee records</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Browse the table: Employee Code, Name, Department, Position,
                Status.
              </li>
              <li className="leading-relaxed pl-1">
                Click the <strong>eye</strong> icon to open{" "}
                <strong>Employee Details</strong> (read-only).
              </li>
              <li className="leading-relaxed pl-1">
                Sections shown: Basic Information, Personal Information, Contact
                Information, Government Information (SSS, PhilHealth, Pag-IBIG,
                TIN), and System Information (RFID, Fingerprint ID, hired date,
                created date).
              </li>
              <li className="leading-relaxed pl-1">
                If status is Resigned or Terminated, <strong>Separation
                Information</strong> appears (dates and final pay summary when
                recorded).
              </li>
            </ol>

            
          </div>

          <Separator />

          {/* Search & filters */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Employee search and filters</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-1">
              <li>
                <strong>Search</strong> — by name or employee code (updates after a
                short pause).
              </li>
              <li>
                <strong>Status</strong> — All, Active, Resigned, or Terminated.
              </li>
              <li>
                <strong>Clear Filters</strong> and <strong>Refresh</strong> reset
                the list.
              </li>
              <li>
                <strong>Pagination</strong> — rows per page (5, 10, 25, 50) and
                page buttons at the bottom of the table.
              </li>
            </ul>

            
          </div>

          <Separator />

          {/* Add */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Adding employees</h3>
            <p className="text-sm text-muted-foreground">
              Available to <strong>Administrator</strong> and{" "}
              <strong>HR Admin</strong> (Add Employee button).
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Click <strong>Add Employee</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Complete required fields: Employee Code, First Name, Last Name,
                Department, Position (Status defaults to Active; Hired Date
                defaults to today).
              </li>
              <li className="leading-relaxed pl-1">
                Optionally fill personal, contact, emergency contact, government
                IDs, RFID tag, and fingerprint ID.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Create Employee</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                To let them log in, go to <strong>Accounts</strong> and create a
                user linked to this employee.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              <strong>Impact:</strong> New employees appear in lists used by
              payroll, attendance, leave, and approvals. They do not receive login
              access until an account is created.
            </p>

            
          </div>

          <Separator />

          {/* Edit */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Editing employee information</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li className="leading-relaxed pl-1">
                Click the <strong>pencil</strong> icon on a row.
              </li>
              <li className="leading-relaxed pl-1">
                Update fields in the same sections as add (basic, personal,
                contact, government, system).
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Save Changes</strong>.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Department and position are typed in as text (not chosen from a fixed
              company list in this screen).
            </p>

            
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Employee status management</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Status is set when adding or editing an employee:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 mb-3">
              <li>
                <strong>Active</strong> — currently employed
              </li>
              <li>
                <strong>Resigned</strong> — voluntary separation; you can enter
                resignation date and last working date
              </li>
              <li>
                <strong>Terminated</strong> — employer-ended separation; you can
                enter termination date and last working date
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              <strong>Impact:</strong> Inactive statuses affect how the employee is
              treated in HR processes. Separation dates support final pay tracking.
              View mode may show whether final pay was processed and the amount when
              that data exists.
            </p>
          </div>

          <Separator />

          {/* Reports / uploads */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Reports, imports, and photos</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-1">
              <li>
                No export, download, or bulk import on the Employees page.
              </li>
              <li>
                No photo upload control in the employee form — the view shows an
                initial letter avatar only.
              </li>
              <li>
                RFID tag and Fingerprint ID fields support linking to physical
                time devices (how devices connect is outside this screen).
              </li>
            </ul>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Employee permissions</h3>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-3 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium">Administrator</th>
                    <th className="px-3 py-2 font-medium">HR Admin</th>
                    <th className="px-3 py-2 font-medium">HR</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {employeeAccessRows.map((row) => (
                    <tr key={row.action} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <span className="text-foreground">{row.action}</span>
                        {row.note && (
                          <span className="block text-xs mt-0.5">{row.note}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{row.admin}</td>
                      <td className="px-3 py-2">{row.hrAdmin}</td>
                      <td className="px-3 py-2">{row.hr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Needs confirmation */}
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
              Needs confirmation
            </p>
            <ul className="space-y-2 text-sm text-purple-900/90 dark:text-purple-300/90 list-disc list-inside ml-1">
              <li>
                Whether HR and HR Admin should receive a sidebar link to Employees
                (today only Administrator sees the menu item).
              </li>
              <li>
                Standard department and position lists if your company uses fixed
                values instead of free text.
              </li>
              <li>
                Whether profile photos are stored elsewhere or planned for a future
                update.
              </li>
            </ul>
          </div>

          {/* Important notes */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                Important notes
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-blue-800/90 dark:text-blue-300/90">
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Create the <strong>employee record first</strong>, then create
                  the <strong>user account</strong> under Accounts.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Employee code should stay unique — duplicates may cause errors
                  when saving.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Assign leave approvers and payroll settings after the employee
                  exists in the system.
                </span>
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                Employee troubleshooting
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-amber-900/90 dark:text-amber-300/90">
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Required field errors</strong> — Employee code, first
                  name, department, and position must be filled before save.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>No Add Employee button</strong> — Only Administrator and
                  HR Admin can add or edit; HR can view only.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Cannot find employee</strong> — Clear filters, check
                  status (Active vs Resigned/Terminated), refresh the list.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Employee cannot log in</strong> — Create an account under
                  Accounts and link it to the correct employee.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/employees" />
  </div>
);

export default EmployeesDocs;
