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

const DeviceUserMappingDocs = () => (
  <div className="space-y-8">
    <section id="device-user-mapping" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Device User Mapping Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to link device user IDs to employee records in UnivoHR.
            Device User Mapping tells the system which employee a specific
            device user ID belongs to. Without these mappings, biometric or
            card reader punch logs cannot be associated with an employee for
            attendance processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">System Administrator</Badge>
              <Badge variant="outline">After device setup</Badge>
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
                  <strong>After devices are registered</strong> — map
                  employees to their device user IDs so their punches are
                  recognized.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>New employees added</strong> — create a mapping so
                  their device enrollment is linked to their record.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Device replacement</strong> — update mappings when
                  employees are re-enrolled on a new device with a different
                  user ID.
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
                  Devices registered in the system (see{" "}
                  <strong>Device Setup Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Employees already created in the system
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  The device user IDs enrolled on each device (e.g.,
                  fingerprint ID, RFID tag number, user code)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  The <strong>devices.manage</strong> permission to create
                  mappings
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding a device user mapping
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open System Settings.</strong> From the sidebar, click{" "}
                <strong>Settings</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Devices tab.</strong> Click the{" "}
                <strong>Devices</strong> tab, then click the{" "}
                <strong>Device User Mapping</strong> sub-tab.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Mapping.</strong> Click the{" "}
                <strong>Add Mapping</strong> button. The{" "}
                <strong>Add Mapping</strong> dialog opens with the
                description:{" "}
                <em>Map a device user ID to an employee record.</em>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the employee.</strong> Click the{" "}
                <strong>Select Employee</strong> button. The{" "}
                <strong>Select Employee</strong> dialog opens. Search by name,
                code, or department, then click the employee. The employee's
                code, name, and department appear in the form.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the device.</strong> Open the{" "}
                <strong>Device *</strong> dropdown and choose the device where
                the employee is enrolled.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the device user ID.</strong> In the{" "}
                <strong>Device User ID *</strong> field, type the user
                identifier from the device (placeholder text:{" "}
                <em>e.g. 1001, USER001, 12345</em>). This could be a
                fingerprint ID, RFID tag, card number, or username depending
                on your device type.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set as active (optional).</strong> The{" "}
                <strong>Active</strong> toggle is on by default. Turn it off
                to create an inactive mapping.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save.</strong> Click the <strong>Create</strong>{" "}
                button. A green message says{" "}
                <strong>Mapping created</strong>. The new mapping appears in
                the table.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing existing mappings
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Search by employee.</strong> Use the{" "}
                <strong>Search by employee name or code...</strong> field to
                filter mappings.
              </li>
              <li className="leading-relaxed pl-1">
                The table shows: Employee Code, Employee Name, Device, Device
                User ID, Status (Active/Inactive badge), and Actions.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Edit a mapping.</strong> Click the{" "}
                <strong>Edit</strong> icon. The{" "}
                <strong>Edit Mapping</strong> dialog opens. Update the
                employee, device, or user ID as needed, then click{" "}
                <strong>Update</strong>. A green message says{" "}
                <strong>Mapping updated</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Delete a mapping.</strong> Click the{" "}
                <strong>Delete</strong> icon. A confirmation prompt says{" "}
                <em>Delete this device user mapping?</em>. Click OK. A green
                message says <strong>Mapping deleted</strong>.
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
                  <strong>One employee can have multiple mappings</strong> —
                  for different devices (e.g., fingerprint on main door and
                  card reader on side entrance).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Device User ID must match what is enrolled:</strong>{" "}
                  The ID entered here must exactly match the user ID stored
                  on the physical device.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Inactive mappings are ignored:</strong> If a mapping
                  is set to Inactive, punches from that device for that user
                  ID will not be processed.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Employee, device, and user ID are required:</strong>{" "}
                  All three fields must be filled before the mapping can be
                  saved.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If mapping setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Select an employee</strong> — make sure an employee
                  is selected before saving.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Select a device</strong> — make sure a device is
                  chosen from the dropdown.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Device User ID is required</strong> — the user ID
                  field cannot be empty.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Add Mapping button disabled</strong> — your account
                  may not have the <strong>devices.manage</strong> permission.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/device-user-mapping" />
  </div>
);

export default DeviceUserMappingDocs;
