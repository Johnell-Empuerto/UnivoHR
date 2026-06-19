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

const FirstAdminLoginDocs = () => (
  <div className="space-y-8">
    <section id="first-admin-login" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">First Admin Login Guide</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Learn how to log in to UnivoHR for the first time using the default
            admin account. Logging in is the first step before you can set up
            your company, add employees, configure attendance, process payroll,
            or use any other feature in the system.
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
              <Badge variant="outline">First-time login</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Before you start</h3>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                      Item
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                      Example
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/50">
                    <td className="px-4 py-2 text-muted-foreground">
                      System website link / URL
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      https://your-company-univohr-link.com
                    </td>
                  </tr>
                  <tr className="border-t border-border/50">
                    <td className="px-4 py-2 text-muted-foreground">
                      Default admin username
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">admin</td>
                  </tr>
                  <tr className="border-t border-border/50">
                    <td className="px-4 py-2 text-muted-foreground">
                      Default admin password
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">admin123</td>
                  </tr>
                  <tr className="border-t border-border/50">
                    <td className="px-4 py-2 text-muted-foreground">
                      Internet or local network connection
                    </td>
                    <td className="px-4 py-2">Stable connection</td>
                  </tr>
                  <tr className="border-t border-border/50">
                    <td className="px-4 py-2 text-muted-foreground">
                      A web browser
                    </td>
                    <td className="px-4 py-2">
                      Google Chrome, Microsoft Edge, or Mozilla Firefox
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              The implementation team may change the default credentials before
              handing over the system. If you received different login details,
              use those instead.
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
                <strong>Open the UnivoHR login page.</strong> Open your web
                browser, click the address bar, type the system link provided by
                your implementation team, and press Enter. Wait for the login
                page to load.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the admin username.</strong> Click inside the{" "}
                <strong>Username</strong> field and type the admin username (
                <span className="font-mono text-xs">admin</span> by default).
                Usernames are case-sensitive.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Enter the admin password.</strong> Click inside the{" "}
                <strong>Password</strong> field and type the admin password (
                <span className="font-mono text-xs">admin123</span> by default).
                Characters appear as dots for security. Check that Caps Lock is
                off — passwords are case-sensitive.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Click Sign In.</strong> Click the{" "}
                <strong>Sign In</strong> button once and wait for the system to
                verify your account (1–3 seconds). Do not click repeatedly.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Confirm successful login.</strong> After a successful
                login, you will see the <strong>Dashboard</strong> page with
                summary cards and the sidebar menu. The system is now ready.
              </li>
            </ol>
          </div>

          <Separator />

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                What happens after login
              </h3>
            </div>
            <p className="text-sm text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
              The dashboard gives you an overview of your company's data. Since
              this is a fresh system with no data yet, the dashboard may show
              empty or zero values — this is expected. Your first recommended
              action is to change the default admin password (next guide).
            </p>
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
                  <strong>Wrong username or password</strong> — Recheck spelling
                  and check that Caps Lock is off.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Page does not load</strong> — Check your internet or
                  network connection. Try refreshing (F5).
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Account locked</strong> — After several failed
                  attempts, wait about 15 minutes before trying again.
                </span>
              </li>
              <li className="text-sm text-amber-900/90 dark:text-amber-300/90 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                <span>
                  <strong>Forgot password</strong> — Use the Forgot Password
                  link on the login page if email (SMTP) is configured. If not,
                  contact the implementation team.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-sm text-red-900 dark:text-red-200">
                Security reminder
              </h3>
            </div>
            <ul className="space-y-1">
              <li className="text-sm text-red-800/90 dark:text-red-300/90 flex gap-2">
                <span className="text-red-500 shrink-0">•</span>
                <span>
                  <strong>Do not share the admin password</strong> with anyone
                  who does not need it.
                </span>
              </li>
              <li className="text-sm text-red-800/90 dark:text-red-300/90 flex gap-2">
                <span className="text-red-500 shrink-0">•</span>
                <span>
                  <strong>Change the default password immediately.</strong> The
                  next guide explains how.
                </span>
              </li>
              <li className="text-sm text-red-800/90 dark:text-red-300/90 flex gap-2">
                <span className="text-red-500 shrink-0">•</span>
                <span>
                  <strong>Do not use the default password</strong> during real
                  company operations.
                </span>
              </li>
            </ul>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/first-admin-login" />
  </div>
);

export default FirstAdminLoginDocs;
