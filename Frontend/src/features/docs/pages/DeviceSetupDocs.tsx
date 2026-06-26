import { AlertTriangle, CheckCircle2, Info, Monitor, Users } from "lucide-react";
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

const DeviceSetupDocs = () => (
  <div className="space-y-8">
    <section id="device-setup" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Device Setup Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to register biometric devices, card readers, and other
            attendance hardware in UnivoHR. Once a device is registered, the
            system can receive punch logs and associate them with employee
            records for attendance tracking.
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
              <Badge variant="outline">After notification setup</Badge>
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
                  <strong>First-time hardware setup</strong> — when
                  installing biometric or card reader devices for the first
                  time.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Adding new devices</strong> — when expanding to new
                  locations or branches.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Replacing or updating hardware</strong> — when
                  swapping out old devices.
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
                  Device hardware is set up and connected to the network
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  The device IP address and port number (e.g., 192.168.1.100,
                  port 4370)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  The <strong>devices.manage</strong> permission to add and
                  manage devices
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  Branches already set up (see{" "}
                  <strong>Branch Setup Guide</strong>) if you want to assign
                  devices to specific branches
                </span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Device types and statuses
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              The system supports these device types:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4 mb-3">
              <li className="list-disc">
                <strong>Biometric</strong> — fingerprint or face recognition
                devices
              </li>
              <li className="list-disc">
                <strong>Card Reader</strong> — RFID or magnetic card readers
              </li>
              <li className="list-disc">
                <strong>Mobile App</strong> — mobile-based attendance check-in
              </li>
              <li className="list-disc">
                <strong>API Endpoint</strong> — HTTP-based device integration
              </li>
              <li className="list-disc">
                <strong>Other</strong> — custom or unsupported device types
              </li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each device has a status:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li className="list-disc">
                <strong>Active</strong> — device is online and ready (green
                badge)
              </li>
              <li className="list-disc">
                <strong>Inactive</strong> — device is deactivated (gray badge)
              </li>
              <li className="list-disc">
                <strong>Offline</strong> — device is not responding (yellow
                badge)
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Adding a device
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open System Settings.</strong> From the sidebar, click{" "}
                <strong>Settings</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Open the Devices tab.</strong> Click the{" "}
                <strong>Devices</strong> tab. The{" "}
                <strong>Device Integrations</strong> card appears with four
                sub-tabs. Make sure the <strong>Devices</strong> sub-tab is
                active.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Add Device.</strong> Click the{" "}
                <strong>Add Device</strong> button with the Plus icon. The{" "}
                <strong>Add Device</strong> dialog opens with the description:{" "}
                <em>Configure the device connection details.</em>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Fill in the device details:</strong>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>
                    <strong>Device Name *</strong> — a descriptive name
                    (placeholder: e.g. Main Entrance Biometric)
                  </li>
                  <li>
                    <strong>Type</strong> — select one of: Biometric, Card
                    Reader, Mobile App, API Endpoint, Other
                  </li>
                  <li>
                    <strong>Status</strong> — select Active, Inactive, or
                    Offline (default: Active)
                  </li>
                  <li>
                    <strong>Serial Number</strong> — optional device serial
                    number
                  </li>
                  <li>
                    <strong>Model</strong> — optional device model name
                  </li>
                  <li>
                    <strong>IP Address</strong> — the device network address
                    (placeholder: e.g. 192.168.1.100)
                  </li>
                  <li>
                    <strong>Port</strong> — the device port (placeholder: e.g.
                    4370)
                  </li>
                  <li>
                    <strong>Location</strong> — physical location description
                    (placeholder: e.g. Main Entrance)
                  </li>
                  <li>
                    <strong>Branch</strong> — assign to a branch from the
                    dropdown
                  </li>
                  <li>
                    <strong>API Key</strong> — optional auth key for API-based
                    devices
                  </li>
                  <li>
                    <strong>Notes</strong> — optional notes about the device
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Save.</strong> Click the <strong>Create</strong>{" "}
                button. A green message says{" "}
                <strong>Device created</strong>. The new device appears in
                the table with its details.
              </li>
            </ol>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Managing devices
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Search devices.</strong> Use the{" "}
                <strong>Search devices...</strong> field to filter the table.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>View device info.</strong> The table shows Name, Type,
                IP Address, Location, Branch, Status (color-coded badge),
                Logs (showing total and pending counts), and Actions.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Edit a device.</strong> Click the <strong>Edit</strong>{" "}
                icon. The <strong>Edit Device</strong> dialog opens with
                current values pre-filled. Make changes and click{" "}
                <strong>Update</strong>. A green message says{" "}
                <strong>Device updated</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Delete a device.</strong> Click the{" "}
                <strong>Delete</strong> icon (red Trash2). A confirmation
                prompt says{" "}
                <em>Delete this device and all associated data?</em>. Click
                OK to confirm. A green message says{" "}
                <strong>Device deleted</strong>.
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
                  <strong>Device name is required:</strong> You cannot save a
                  device without a name. Other fields are optional.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Device User Mapping is separate:</strong> After
                  adding a device, you need to map device user IDs to
                  employee records in the{" "}
                  <strong>Device User Mapping</strong> sub-tab.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Log processing configuration:</strong> If the device
                  sends raw data in a custom format, configure{" "}
                  <strong>Device Log Mappings</strong> to translate source
                  fields to system fields.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Pending logs:</strong> The Logs column shows how
                  many logs are pending processing. Processed logs are used
                  for attendance.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If device setup fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Devices tab not visible</strong> — Your account may
                  not have the <strong>devices.view</strong> permission.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Device name is required</strong> — Make sure the
                  Device Name field is filled in.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Failed to save device</strong> — Check your
                  connection and try again. Verify the device name is unique.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Device shows offline</strong> — Verify the IP
                  address and port are correct, and that the device is
                  connected to the network.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/device-setup" />
  </div>
);

export default DeviceSetupDocs;
