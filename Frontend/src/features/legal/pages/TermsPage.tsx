// features/legal/pages/TermsPage.tsx
import {
  FileText,
  Users,
  Shield,
  AlertCircle,
  CheckCircle,
  Scale,
  Lock,
  Clock,
  LogOut,
  UserCheck,
  Bell,
  Database,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

const TermsPage = () => {
  const navigate = useNavigate();

  const userResponsibilities = [
    "Maintain the confidentiality of your account credentials",
    "Provide accurate and truthful information",
    "Report any security concerns or unauthorized access immediately",
    "Do not share your account with others",
    "Use the system only for legitimate business purposes",
  ];

  const acceptableActions = [
    "Submit accurate attendance, leave, and overtime requests",
    "Respect the privacy and data of other employees",
    "Use the system in compliance with company policies",
  ];

  const prohibitedActions = [
    "Do not attempt to access unauthorized data",
    "Do not manipulate or falsify attendance records",
    "Do not share sensitive payroll information",
  ];

  const accountManagement = [
    {
      icon: UserCheck,
      title: "Unique Accounts",
      description:
        "Each employee receives one account linked to their employee ID",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description:
        "ADMIN, HR_ADMIN, HR, and EMPLOYEE roles with specific permissions",
    },
    {
      icon: Clock,
      title: "Account Deactivation",
      description: "Accounts are deactivated upon employment termination",
    },
    {
      icon: LogOut,
      title: "Inactive Accounts",
      description: "Inactive accounts may be disabled after extended non-use",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Terms | HRMS</title>
      </Helmet>

      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="mb-6 gap-2 hover:bg-muted transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>

          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
              <Scale className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Please read these terms carefully before using UnivoHR.
            </p>
            <div className="flex justify-center mt-4">
              <Badge variant="secondary" className="text-xs">
                Effective Date: April 2026
              </Badge>
            </div>
          </div>

          {/* Acceptance of Terms */}
          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Acceptance of Terms</CardTitle>
                  <CardDescription>
                    By using UnivoHR, you agree to these terms
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                By accessing and using UnivoHR, you agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do
                not use the system.
              </p>
            </CardContent>
          </Card>

          {/* User Responsibilities & Acceptable Use */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle>User Responsibilities</CardTitle>
                    <CardDescription>What we expect from you</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userResponsibilities.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Acceptable Use</CardTitle>
                    <CardDescription>Approved system usage</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {acceptableActions.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="space-y-2">
                  {prohibitedActions.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-red-600 dark:text-red-400">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Management */}
          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Account Management</CardTitle>
                  <CardDescription>How accounts are managed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {accountManagement.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border/50 text-center"
                  >
                    <div className="flex justify-center mb-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Accuracy & System Availability */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>Data Accuracy</CardTitle>
                    <CardDescription>
                      Your responsibility for accurate information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Employees are responsible for ensuring their submitted
                  information is accurate. HR personnel and administrators are
                  responsible for verifying and correcting data when necessary.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle>System Availability</CardTitle>
                    <CardDescription>Our uptime commitment</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We strive to maintain 99.9% uptime but do not guarantee
                  uninterrupted access. Scheduled maintenance will be announced
                  in advance when possible.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Modifications & Termination */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle>Modifications to Terms</CardTitle>
                    <CardDescription>How we update these terms</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We reserve the right to modify these terms at any time. Users
                  will be notified of significant changes via email or system
                  announcements.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle>Termination</CardTitle>
                    <CardDescription>
                      When access may be revoked
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We may suspend or terminate access for violations of these
                  terms, security breaches, or employment termination.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <Card className="border-border/50 shadow-sm bg-primary/5">
            <CardContent className="p-6 text-center">
              <Scale className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">
                Questions About Terms?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                By continuing to use UnivoHR, you acknowledge that you have
                read, understood, and agree to these Terms of Service.
              </p>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Return to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default TermsPage;
