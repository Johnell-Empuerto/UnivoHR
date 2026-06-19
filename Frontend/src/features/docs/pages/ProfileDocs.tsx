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

const ProfileDocs = () => (
  <div className="space-y-8">
    <section id="profile" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Profile</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            View your personal, employment, and emergency contact information stored
            in UnivoHR. The profile page is for viewing your records — updates are
            handled by your HR or administrator team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who can use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">All signed-in users</Badge>
              <Badge variant="outline">View own profile only</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Step-by-step guide</h3>
            </div>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Click your <strong>avatar</strong> (top right) and choose{" "}
                <strong>Profile</strong>, or use Quick Actions on the Dashboard.
              </li>
              <li className="leading-relaxed pl-1">
                Review your name, role, and employment status badges at the top.
              </li>
              <li className="leading-relaxed pl-1">
                Scroll through each section:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                  <li>
                    <strong>Personal Information</strong> — name, birthday, gender,
                    email, phone, address, marital status
                  </li>
                  <li>
                    <strong>Employment Information</strong> — department, position,
                    hire date, and separation dates if applicable
                  </li>
                  <li>
                    <strong>Government IDs</strong> — SSS, PhilHealth, Pag-IBIG
                    (HDMF), TIN
                  </li>
                  <li>
                    <strong>Emergency Contact</strong> — name, relation, phone,
                    address
                  </li>
                  <li>
                    <strong>System Information</strong> — username, RFID tag,
                    fingerprint ID (used for attendance devices at your company)
                  </li>
                </ul>
              </li>
              <li className="leading-relaxed pl-1">
                If anything is wrong or blank, contact HR to request an update.
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
            <ul className="space-y-1.5">
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  This page does not include a save or edit button — it is read-only
                  for employees.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Status may show <strong>Active</strong>, <strong>Resigned</strong>
                  , or <strong>Terminated</strong> depending on your employment record.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Password changes are done through <strong>Forgot Password</strong>{" "}
                  on the login page, not on the profile page.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Administrators manage employee records under{" "}
                  <strong>Employees</strong> and <strong>Accounts</strong> in the
                  sidebar (admin access only).
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                Common errors & troubleshooting
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Profile not found</strong> — Your user may not be linked
                  to an employee record. Contact HR or IT support.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Missing government numbers</strong> — Submit copies to HR
                  for encoding into the system.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Wrong department or position</strong> — Ask HR to update
                  your employee file; changes will appear after refresh.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/profile" />
  </div>
);

export default ProfileDocs;
