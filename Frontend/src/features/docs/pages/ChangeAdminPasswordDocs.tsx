import { AlertTriangle, CheckCircle2, Info, Users, Lock } from "lucide-react";
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

const ChangeAdminPasswordDocs = () => (
  <div className="space-y-8">
    <section id="change-admin-password" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Change Admin Password Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to change the default admin password after logging in to
            UnivoHR for the first time. Changing the default password is
            critical to protect your company's data from unauthorized access.
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
              <Badge variant="secondary">HR Admin</Badge>
              <Badge variant="secondary">Client Admin</Badge>
              <Badge variant="outline">After first login</Badge>
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
                  <strong>Immediately after first admin login</strong> — the
                  default password is not secure and should never be used during
                  real company operations.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>After an admin password reset</strong> — change the
                  temporary reset password to something only you know.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>To improve account security</strong> — periodically
                  update the admin password to keep your system safe.
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
                  Successfully logged in to UnivoHR (see{" "}
                  <strong>First Admin Login Guide</strong>)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>Your current admin password (default or existing)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 shrink-0">✓</span>
                <span>
                  A new strong password ready (see password rules below)
                </span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              The default password (<span className="font-mono">admin123</span>)
              should not be used during real company operations.
            </p>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Step-by-step guide</h3>
            </div>
            <ol className="space-y-4 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Open your Profile page.</strong> Click your{" "}
                <strong>avatar or name</strong> at the top-right corner of the
                screen, then select <strong>Profile</strong> from the dropdown
                menu. The Profile page opens.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Find the Change Password section.</strong> Scroll down
                the Profile page. You will see a card titled{" "}
                <strong>Change Password</strong> with a lock icon. This section
                has three fields.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter your current password.</strong> Click inside the{" "}
                <strong>Current Password</strong> field and type the password
                you are currently using to log in. Characters are hidden for
                security. Use the eye icon to reveal what you typed.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter a new password.</strong> Click inside the{" "}
                <strong>New Password</strong> field and type a new password. The
                new password must meet all the rules listed below the field:
                <ul className="list-disc list-inside mt-2 ml-4 space-y-0.5">
                  <li>At least 8 characters</li>
                  <li>At least 1 uppercase letter (A–Z)</li>
                  <li>At least 1 lowercase letter (a–z)</li>
                  <li>At least 1 number (0–9)</li>
                  <li>At least 1 special character (such as ! @ # $ % ^ &amp; *)</li>
                  <li>No spaces</li>
                </ul>
                <p className="mt-2">
                  As you type, each rule changes color to green when it is
                  satisfied. All rules must turn green before you can save.
                </p>
                <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border/50 text-xs">
                  <p>
                    <strong>Good example:</strong>{" "}
                    <span className="font-mono">Admin@2026</span>
                  </p>
                  <p>
                    <strong>Bad example:</strong>{" "}
                    <span className="font-mono">admin123</span> (no uppercase,
                    no special character)
                  </p>
                </div>
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Confirm your new password.</strong> Click inside the{" "}
                <strong>Confirm New Password</strong> field and re-type the new
                password exactly. If the two passwords do not match, a red error
                message appears below the field.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Change Password.</strong> Click the{" "}
                <strong>Change Password</strong> button at the bottom of the
                section. Wait a moment — the button changes to{" "}
                <strong>Changing...</strong> while the system processes your
                request. Do not click the button multiple times.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Confirm the password was changed.</strong> A green
                success message will appear at the top of the screen saying the
                password was changed successfully. All three password fields
                will be cleared automatically. The next time you log in, use
                your new password.
              </li>
            </ol>
          </div>

          <Separator />

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                What happens after changing the password
              </h3>
            </div>
            <p className="text-sm text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
              The system saves your new password immediately. You can continue
              working without logging out. The next time you sign out and log
              back in, you must use the new password. Your old password will no
              longer work.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                If the password change fails
              </h3>
            </div>
            <ul className="space-y-1.5">
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Current password is incorrect</strong> — Recheck the
                  old password and make sure Caps Lock is off. If you forgot the
                  current password, ask the implementation team for help.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>New password is too weak</strong> — Follow all the
                  password rules listed under the New Password field. All rules
                  must turn green.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Confirm password does not match</strong> — Re-type the
                  new password carefully in both the New Password and Confirm
                  New Password fields. They must be exactly the same.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Session expired</strong> — If your session timed out
                  while filling in the form, log in again and repeat the steps.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-sm text-red-900 dark:text-red-200">
                Important security reminder
              </h3>
            </div>
            <ul className="space-y-1">
              <li className="text-sm text-red-800/90 dark:text-red-300/90 flex gap-2">
                <span className="text-red-500 shrink-0">•</span>
                <span>
                  <strong>Do not share the admin password</strong> with anyone
                  who does not need it. Each admin should have their own
                  account.
                </span>
              </li>
              <li className="text-sm text-red-800/90 dark:text-red-300/90 flex gap-2">
                <span className="text-red-500 shrink-0">•</span>
                <span>
                  <strong>Do not write down the password</strong> on paper near
                  the computer.
                </span>
              </li>
              <li className="text-sm text-red-800/90 dark:text-red-300/90 flex gap-2">
                <span className="text-red-500 shrink-0">•</span>
                <span>
                  <strong>Use a strong unique password</strong> that you do not
                  use for personal accounts.
                </span>
              </li>
              <li className="text-sm text-red-800/90 dark:text-red-300/90 flex gap-2">
                <span className="text-red-500 shrink-0">•</span>
                <span>
                  <strong>Change the password again</strong> if you suspect
                  someone else knows it.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/change-admin-password" />
  </div>
);

export default ChangeAdminPasswordDocs;
