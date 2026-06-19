import { AlertTriangle, CheckCircle2, Info, GitBranch, Users } from "lucide-react";
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

const DeviceLogMappingDocs = () => (
  <div className="space-y-8">
    <section id="device-log-mapping" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Device Log Mapping Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to configure device log field mappings in UnivoHR.
            Device Log Mappings define how raw data fields from a device
            payload are translated into system fields such as employee code,
            timestamp, and event type. This is only needed when your device
            sends data in a custom format.
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
              <Badge variant="outline">After user mapping</Badge>
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
                  <strong>Device sends custom payloads</strong> — when the
                  raw data from your device uses field names that differ from
                  the system's expected format.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Standard devices</strong> — most standard biometric
                  and card reader devices work without log mappings. This
                  feature is for non-standard or API-based integrations.
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Understanding log mappings
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A log mapping tells the system:{" "}
              <em>"When the device sends a field called X, treat it as the
              system field Y."</em> For example, if your device sends{" "}
              <code className="text-xs">{"{"}"user_id": "1001"{"}"}</code>, you
              can map the source field <strong>user_id</strong> to the target
              field <strong>employee_code</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Available target fields:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4 mt-1">
              <li className="list-disc">
                <strong>employee_code</strong> — maps to an employee's unique
                code
              </li>
              <li className="list-disc">
                <strong>timestamp</strong> — the date and time of the punch
              </li>
              <li className="list-disc">
                <strong>event_type</strong> — identifies if the log is IN,
                OUT, or break
              </li>
              <li className="list-disc">
                <strong>device_id</strong> — identifies which device sent
                the log
              </li>
              <li className="list-disc">
                <strong>employee_id</strong> — alternative employee
                identifier
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding a log mapping
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
                <strong>Device Log Mappings</strong> sub-tab.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Mapping.</strong> Click the{" "}
                <strong>Add Mapping</strong> button. The{" "}
                <strong>Add Mapping</strong> dialog opens with the
                description:{" "}
                <em>Map a source field from the device payload to a system
                field.</em>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the device.</strong> Open the{" "}
                <strong>Device *</strong> dropdown and choose the device this
                mapping applies to.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the source field.</strong> Open the{" "}
                <strong>Source Field *</strong> dropdown and choose the field
                name as it appears in the device payload. Options include:{" "}
                <code className="text-xs">employee_code</code>,{" "}
                <code className="text-xs">user_id</code>,{" "}
                <code className="text-xs">card_number</code>,{" "}
                <code className="text-xs">timestamp</code>,{" "}
                <code className="text-xs">event_type</code>, and many more.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Select the target field.</strong> Open the{" "}
                <strong>Target Field *</strong> dropdown and choose which
                system field to map to.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Set a transform expression (optional).</strong> In the{" "}
                <strong>Transform Expression (optional)</strong> field, you
                can enter a transformation like{" "}
                <code className="text-xs">trim</code>,{" "}
                <code className="text-xs">uppercase</code>, or other
                expressions to modify the source value before storage.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save.</strong> Click the <strong>Create</strong>{" "}
                button. A green message says{" "}
                <strong>Mapping created</strong>. The new mapping appears in
                the table showing Device, Source Field, Target Field,
                Transform, and Status.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing log mappings
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Filter by device.</strong> Use the{" "}
                <strong>All Devices</strong> filter at the top to show
                mappings for a specific device.
              </li>
              <li className="leading-relaxed pl-1">
                The table shows: Device, Source Field, Target Field, Transform
                (if any), Status (Active/Inactive badge), and Actions.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Toggle active status.</strong> Use the toggle switch
                in the Actions column to enable or disable a mapping without
                deleting it.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Edit a mapping.</strong> Click the{" "}
                <strong>Edit</strong> icon. Update the fields as needed and
                click <strong>Update</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Delete a mapping.</strong> Click the{" "}
                <strong>Delete</strong> icon. Confirm the prompt. A green
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
                  <strong>Only needed for non-standard devices:</strong> Most
                  standard biometric and card reader devices send data in a
                  format the system already understands. Log mappings are
                  primarily for custom API-based integrations.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Device, source field, and target field are
                  required:</strong> All three must be selected before saving.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Inactive mappings are skipped:</strong> Disable a
                  mapping via the toggle to have it ignored during log
                  processing.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>View raw payloads:</strong> To see exactly what
                  data a device is sending, check the{" "}
                  <strong>Raw Logs</strong> sub-tab and click the eye icon on
                  a log entry.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/device-log-mapping" />
  </div>
);

export default DeviceLogMappingDocs;
