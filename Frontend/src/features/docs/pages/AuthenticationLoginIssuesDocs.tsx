import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
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

const AuthenticationLoginIssuesDocs = () => (
  <div className="space-y-8">
    <section id="authentication-login-issues" className="scroll-mt-24">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Authentication and Login Issues Guide
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Troubleshoot login problems, password resets, and account
            lockouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Who should use this</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Administrator</Badge>
              <Badge variant="secondary">All Employees</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-sm">
                Common login issues
              </h3>
            </div>
            <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                <strong>Forgot password:</strong> On the login page, click{" "}
                <strong>Forgot Password</strong>. Enter your email to receive
                a reset link. Follow the link to set a new password.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Account locked:</strong> After multiple failed login
                attempts, the account locks temporarily. Wait 15 minutes or
                contact an Administrator to unlock it.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>No account exists:</strong> If you have not received
                login credentials, ask a user with the required permissions to create a user account
                linked to your employee record.
              </li>
              <li className="leading-relaxed pl-1">
                <strong>Incorrect credentials:</strong> Double-check your
                email/username and password. Passwords are case-sensitive.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">
                Admin: resetting a user's password
              </h3>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li className="leading-relaxed pl-1">
                Go to <strong>Users</strong> from the sidebar.
              </li>
              <li className="leading-relaxed pl-1">
                Find the user and click the <strong>Reset Password</strong>{" "}
                action.
              </li>
              <li className="leading-relaxed pl-1">
                Enter a temporary password and provide it to the user
                securely. The user should change it on first login.
              </li>
            </ol>
          </div>

          
        </CardContent>
      </Card>
    </section>
    <DocsNavigation currentPath="/docs/authentication-login-issues" />
  </div>
);

export default AuthenticationLoginIssuesDocs;
