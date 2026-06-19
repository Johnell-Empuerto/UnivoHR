import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  List,
  FileText,
  Eye,
  History,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DocsNavigation from "../components/DocsNavigation";

const EmployeeBulkUploadDocs = () => {
  return (
    <div className="space-y-8">
      <section id="overview" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              Employee Bulk Upload Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                1. Overview
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Employee Bulk Upload is used when a company already has many employees, such as hundreds
                or 10,000+ employees, and manual one-by-one creation is not practical. Instead of adding
                each employee individually through the Add Employee form, you can download an official
                Excel template, fill in the employee data, and upload the file to create all employees
                at once.
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <List className="h-4 w-4 text-blue-600" />
                2. When to Use Bulk Upload
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li><span className="font-medium text-foreground">Initial company setup</span> — When setting up UnivoHR for the first time with an existing workforce</li>
                <li><span className="font-medium text-foreground">Migrating from old HR/payroll system</span> — When switching from another system and need to transfer employee data</li>
                <li><span className="font-medium text-foreground">Adding many new employees</span> — When hiring a large group, such as for a new branch or department</li>
                <li><span className="font-medium text-foreground">Branch expansion</span> — When opening new branches that need employee records created</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                3. Important Rules Before Uploading
              </h3>
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-4 space-y-2 text-sm">
                <p className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" /><span>Use the official template only. Do not create your own Excel file from scratch.</span></p>
                <p className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" /><span>Do not rename or reorder column headers. The system reads columns by their exact header name.</span></p>
                <p className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" /><span>Do not remove any columns from the template. Extra columns are ignored, but missing columns will cause errors.</span></p>
                <p className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" /><span>Branch must already exist in the Branches module before uploading.</span></p>
                <p className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" /><span>Employee Code must be unique if manually provided. Duplicate codes in the file or in the system are rejected.</span></p>
                <p className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" /><span>If Employee Code auto-generation is enabled in Settings, Employee Code can be left blank.</span></p>
                <p className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" /><span>User login accounts are NOT created by employee bulk upload. Accounts must be created separately.</span></p>
                <p className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" /><span>Validation happens before import. No employees are inserted until you click Confirm Import.</span></p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600" />
                4. Step 1: Open Bulk Upload
              </h3>
              <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Go to the <span className="font-medium text-foreground">Employees</span> module from the sidebar menu</li>
                <li>Click the <span className="font-medium text-foreground">Bulk Upload</span> button located beside the Add Employee button</li>
                <li>The <span className="font-medium text-foreground">Employee Bulk Import</span> dialog opens</li>
              </ol>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600" />
                5. Step 2: Download Template
              </h3>
              <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground">
                <li>In the Bulk Import dialog, click <span className="font-medium text-foreground">Download Template</span></li>
                <li>Open the downloaded Excel file</li>
                <li>Read the <span className="font-medium text-foreground">Instructions</span> sheet for a quick reference</li>
                <li>Fill in your employee data in the <span className="font-medium text-foreground">Template</span> sheet only</li>
                <li>Do not modify, rename, or delete the header row</li>
              </ol>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                6. Template Columns
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>The template contains 25 columns. Below is a description of each column:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Employee Code</p>
                    <p className="text-xs">Unique identifier. Leave blank to auto-generate if enabled.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">First Name</p>
                    <p className="text-xs">Employee's given name (required).</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Middle Name</p>
                    <p className="text-xs">Optional middle name.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Last Name</p>
                    <p className="text-xs">Employee's surname (required).</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Suffix</p>
                    <p className="text-xs">E.g., Jr., Sr., III.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Email</p>
                    <p className="text-xs">Optional. Must be unique if provided.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Phone</p>
                    <p className="text-xs">Contact number.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Gender</p>
                    <p className="text-xs">Accepted: Male, Female, Other.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Birth Date</p>
                    <p className="text-xs">YYYY-MM-DD format recommended.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Hire Date</p>
                    <p className="text-xs">Required. Cannot be a future date.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Branch</p>
                    <p className="text-xs">Must match active Branch Name or Code (required).</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Department</p>
                    <p className="text-xs">Department name.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Position</p>
                    <p className="text-xs">Job position/title.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Employment Status</p>
                    <p className="text-xs">Accepted: Probationary, Regular.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Employee Status</p>
                    <p className="text-xs">Accepted: ACTIVE, RESIGNED, TERMINATED.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Basic Salary</p>
                    <p className="text-xs">Must be a positive number.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Address</p>
                    <p className="text-xs">Complete address.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">SSS Number</p>
                    <p className="text-xs">SSS government ID.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">PhilHealth Number</p>
                    <p className="text-xs">PhilHealth government ID.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Pag-IBIG Number</p>
                    <p className="text-xs">Pag-IBIG government ID.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">TIN Number</p>
                    <p className="text-xs">TIN government ID.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Emergency Contact Name</p>
                    <p className="text-xs">Name of emergency contact person.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Emergency Contact Number</p>
                    <p className="text-xs">Phone number of emergency contact.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Emergency Contact Address</p>
                    <p className="text-xs">Address of emergency contact.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Emergency Contact Relation</p>
                    <p className="text-xs">Relationship to employee (e.g., Spouse, Parent).</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <List className="h-4 w-4 text-blue-600" />
                7. Required Fields
              </h3>
              <p className="text-sm text-muted-foreground">The following fields must not be left blank:</p>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li><span className="font-medium text-foreground">First Name</span></li>
                <li><span className="font-medium text-foreground">Last Name</span></li>
                <li><span className="font-medium text-foreground">Hire Date</span></li>
                <li><span className="font-medium text-foreground">Branch</span></li>
                <li><span className="font-medium text-foreground">Employee Code</span> — only if auto-generation is disabled in Settings</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                8. Employee Code Rules
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>If <span className="font-medium text-foreground">auto-generation is ON</span>: Leave Employee Code blank to generate automatically. You may also provide a custom code.</li>
                <li>If <span className="font-medium text-foreground">auto-generation is OFF</span>: Employee Code is required for every row.</li>
                <li>If a custom code is provided, it must not already exist in the system.</li>
                <li>Duplicate codes within the same file will be rejected with an error showing the first occurrence row number.</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                9. Branch Rules
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Branch must match an existing active branch name or branch code exactly.</li>
                <li>Wrong spelling, extra spaces, or different capitalization may cause a validation error.</li>
                <li>Inactive branches are rejected. Only active branches can be used.</li>
                <li>Example acceptable values: <span className="font-mono text-xs bg-muted px-1">Main Branch</span> or <span className="font-mono text-xs bg-muted px-1">MAIN</span></li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600" />
                10. Step 3: Upload and Validate
              </h3>
              <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Click <span className="font-medium text-foreground">Choose File</span> and select your filled Excel or CSV file</li>
                <li>Click <span className="font-medium text-foreground">Upload &amp; Validate</span></li>
                <li>The system reads and validates every row against your settings and existing data</li>
                <li>Validation does <span className="font-medium text-foreground">NOT</span> insert employees yet</li>
                <li>Results are displayed immediately</li>
              </ol>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                11. Understanding Validation Results
              </h3>
              <p className="text-sm text-muted-foreground">After validation, the system shows a summary with:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold">{/* total */}&mdash;</p>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold text-green-600">{/* valid */}&mdash;</p>
                  <p className="text-xs text-muted-foreground">Valid Rows</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{/* invalid */}&mdash;</p>
                  <p className="text-xs text-muted-foreground">Invalid Rows</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold text-amber-600">{/* duplicate */}&mdash;</p>
                  <p className="text-xs text-muted-foreground">Duplicate Rows</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Below the summary, a preview table shows each row with its status and any error messages. Rows marked Valid will be imported. Rows marked Invalid will be skipped.</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                12. Common Upload Errors
              </h3>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Field validation errors:</p>
                <ul className="list-disc pl-6 space-y-0.5">
                  <li><span className="font-mono text-xs bg-muted px-1">First Name is required</span> — The First Name cell is empty</li>
                  <li><span className="font-mono text-xs bg-muted px-1">Last Name is required</span> — The Last Name cell is empty</li>
                  <li><span className="font-mono text-xs bg-muted px-1">Hire Date is required</span> — The Hire Date cell is empty</li>
                  <li><span className="font-mono text-xs bg-muted px-1">Invalid Hire Date format</span> — Date is not recognized. Use YYYY-MM-DD</li>
                  <li><span className="font-mono text-xs bg-muted px-1">Hire Date cannot be a future date</span> — Date is after today</li>
                </ul>
                <p className="font-medium text-foreground mt-3 mb-1">Branch errors:</p>
                <ul className="list-disc pl-6 space-y-0.5">
                  <li><span className="font-mono text-xs bg-muted px-1">Branch "XYZ" was not found</span> — Branch name or code does not match</li>
                  <li><span className="font-mono text-xs bg-muted px-1">Branch "XYZ" is inactive</span> — Branch exists but is marked inactive</li>
                </ul>
                <p className="font-medium text-foreground mt-3 mb-1">Duplicate errors:</p>
                <ul className="list-disc pl-6 space-y-0.5">
                  <li><span className="font-mono text-xs bg-muted px-1">Employee Code "EMP001" already exists in the system</span></li>
                  <li><span className="font-mono text-xs bg-muted px-1">Duplicate Employee Code "EMP001" in file (first occurrence at row 2)</span></li>
                  <li><span className="font-mono text-xs bg-muted px-1">Email "juan@example.com" already exists in the system</span></li>
                  <li><span className="font-mono text-xs bg-muted px-1">Duplicate Email "juan@example.com" in file (first occurrence at row 2)</span></li>
                </ul>
                <p className="font-medium text-foreground mt-3 mb-1">Other validation errors:</p>
                <ul className="list-disc pl-6 space-y-0.5">
                  <li><span className="font-mono text-xs bg-muted px-1">Invalid Basic Salary</span> — Must be a valid positive number</li>
                  <li><span className="font-mono text-xs bg-muted px-1">Invalid Employment Status</span> — Use Probationary or Regular</li>
                  <li><span className="font-mono text-xs bg-muted px-1">Invalid Employee Status</span> — Use ACTIVE, RESIGNED, or TERMINATED</li>
                  <li><span className="font-mono text-xs bg-muted px-1">Invalid Gender</span> — Use Male, Female, or Other</li>
                  <li><span className="font-mono text-xs bg-muted px-1">Employee Code is required because auto-generation is disabled</span></li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600" />
                13. Step 4: Download Error Report
              </h3>
              <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground">
                <li>If there are invalid rows, click <span className="font-medium text-foreground">Download Error Report</span></li>
                <li>An Excel file is downloaded listing each error row and its specific error messages</li>
                <li>Open the error report, fix the problematic rows in your original template</li>
                <li>Upload the corrected file again by going back and selecting the fixed file</li>
              </ol>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                14. Step 5: Confirm Import
              </h3>
              <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Review the preview and ensure you are satisfied with the valid rows</li>
                <li>Click <span className="font-medium text-foreground">Confirm Import</span></li>
                <li>This button is only enabled if there is at least one valid row</li>
                <li>Only valid rows are imported. Invalid rows are skipped entirely.</li>
                <li>After successful import, the employee list refreshes automatically</li>
                <li>A success message shows how many employees were imported</li>
              </ol>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" />
                15. Import History
              </h3>
              <p className="text-sm text-muted-foreground">
                The Bulk Import dialog also includes a <span className="font-medium text-foreground">History</span> tab. This shows past import batches with the following information:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Batch ID and original filename</li>
                <li>Total rows, valid rows, invalid rows</li>
                <li>Number of employees imported</li>
                <li>Status (Validated, Completed, Failed)</li>
                <li>Who created the import and when</li>
                <li>When the import was completed</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                16. What Bulk Upload Does Not Do
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Does <span className="font-medium text-foreground">NOT</span> create user login accounts. Each employee must have an account created separately through User Management</li>
                <li>Does <span className="font-medium text-foreground">NOT</span> change payroll computations or settings</li>
                <li>Does <span className="font-medium text-foreground">NOT</span> change attendance records or schedules</li>
                <li>Does <span className="font-medium text-foreground">NOT</span> assign devices, RFID tags, or fingerprint IDs</li>
                <li>Does <span className="font-medium text-foreground">NOT</span> automatically create branches. Branches must exist before uploading</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                17. Best Practices
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Test with <span className="font-medium text-foreground">2-3 rows first</span> to confirm your data format is correct before uploading the full file</li>
                <li>Use <span className="font-medium text-foreground">exact branch names</span> as they appear in the Branches module</li>
                <li>Keep a <span className="font-medium text-foreground">backup</span> of your original Excel file before uploading</li>
                <li>Always <span className="font-medium text-foreground">validate</span> before importing large files to catch errors early</li>
                <li>For very large files (10,000+ employees), consider uploading in smaller batches to make error handling easier</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                18. Troubleshooting
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium">Problem</th>
                      <th className="px-4 py-2 text-left font-medium">Cause</th>
                      <th className="px-4 py-2 text-left font-medium">Solution</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-2">Template will not upload</td>
                      <td className="px-4 py-2">Wrong file type</td>
                      <td className="px-4 py-2">Use .xlsx, .xls, or .csv format only</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Branch not found error</td>
                      <td className="px-4 py-2">Branch name does not match system</td>
                      <td className="px-4 py-2">Check the Branches module for the exact name or code</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Employee code duplicate</td>
                      <td className="px-4 py-2">Code already exists in the system</td>
                      <td className="px-4 py-2">Use a different code or leave blank if auto-generation is enabled</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">No rows imported</td>
                      <td className="px-4 py-2">All rows have validation errors</td>
                      <td className="px-4 py-2">Download the error report, fix the issues, and re-upload</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Confirm Import button is disabled</td>
                      <td className="px-4 py-2">No valid rows or no validated batch</td>
                      <td className="px-4 py-2">Upload and validate a file with at least one valid row first</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <DocsNavigation currentPath="/docs/employee-bulk-upload" />
    </div>
  );
};

export default EmployeeBulkUploadDocs;