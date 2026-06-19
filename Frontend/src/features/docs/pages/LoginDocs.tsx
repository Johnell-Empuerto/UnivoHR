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

const LoginDocs = () => (
  <div className="space-y-8">
    <section id="login" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Login</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Sign in to UnivoHR to access your dashboard, attendance, leave
            requests, payroll, and other tools assigned to your account. You can
            also open the User Manual from the login page without signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who can use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">All employees and HR staff</Badge>
              <Badge variant="outline">User Manual is public (no login)</Badge>
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
                Open the UnivoHR login page in your web browser.
              </li>
              <li className="leading-relaxed pl-1">
                Enter your <strong>Email / Username</strong> and{" "}
                <strong>Password</strong> (passwords are case-sensitive).
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Sign In</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                If your company has email verification turned on, you will see a
                screen asking for a <strong>6-digit code</strong> sent to your
                registered email. Enter the code and click{" "}
                <strong>Verify &amp; Login</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                After a successful sign-in, you are taken to your{" "}
                <strong>Dashboard</strong>.
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Forgot your password?</h3>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                On the login form, click <strong>Forgot Password?</strong>
              </li>
              <li className="leading-relaxed pl-1">
                Enter your <strong>username</strong> and click{" "}
                <strong>Send Verification Code</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Check your registered email for a 6-digit code (also check spam).
                The code expires in about <strong>3 minutes</strong>.
              </li>
              <li className="leading-relaxed pl-1">
                Click <strong>Continue to Verification</strong>, then enter the
                code and your <strong>new password</strong> (at least 6
                characters). Confirm the password and submit.
              </li>
              <li className="leading-relaxed pl-1">
                Return to the login page and sign in with your new password.
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Email verification at login</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Some companies require an extra email code after you enter your
              password. If you see <strong>Verify Your Identity</strong>, enter
              the 6-digit code from your email. You can resend the code after the
              timer ends (about 5 minutes). This feature is controlled by your
              administrator in system settings.
            </p>
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
                  Use the book icon (top right) or <strong>User Manual</strong>{" "}
                  link at the bottom to read help articles without logging in.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Links to <strong>Privacy</strong>, <strong>Terms</strong>, and{" "}
                  <strong>Security</strong> are available on the login page.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  <strong>Contact Support</strong> on the login page reminds you
                  to reach your administrator for account help.
                </span>
              </li>
              <li className="text-sm text-blue-800/90 dark:text-blue-300/90 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                <span>
                  Never share your password. Log out when using a shared computer
                  (avatar menu → Logout).
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
                  <strong>Invalid credentials</strong> — Check username/email and
                  password. Caps Lock may affect your password.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Verification code expired</strong> — Request a new code
                  using Resend Code or start forgot-password again.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>No email received</strong> — Check spam/junk folders and
                  confirm your username matches your account. Contact your HR or
                  IT administrator.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Already logged in</strong> — If you are signed in,
                  visiting the login page redirects you to the Dashboard.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/login" />
  </div>
);

export default LoginDocs;
