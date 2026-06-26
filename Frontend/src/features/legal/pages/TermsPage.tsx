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
  Fingerprint,
  BarChart3,
  ClipboardList,
  HeartHandshake,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

const TermsPage = () => {
  const navigate = useNavigate();

  const userResponsibilities = [
    "Maintain the confidentiality of your account credentials at all times",
    "Provide accurate and truthful information in all modules",
    "Report any security concerns or unauthorized access immediately to your administrator",
    "Do not share your account or session with others",
    "Use the system only for legitimate business purposes related to your role",
    "Ensure that attendance, leave, and overtime submissions are truthful and accurate",
    "Complete assigned forms, evaluations, and requirements within the specified timeframe",
    "Comply with all company policies when using HR self-service features",
  ];

  const acceptableActions = [
    "Submit accurate attendance, leave, overtime, and man-hour requests",
    "View and manage data according to your assigned role permissions",
    "Complete HR forms and performance evaluations as assigned",
    "Access the system for legitimate HR and payroll operations",
    "Use self-service features to view your own records and submit requests",
    "Participate in recruitment and onboarding processes as authorized",
  ];

  const prohibitedActions = [
    "Do not attempt to access data or modules outside your assigned permissions",
    "Do not manipulate or falsify attendance, leave, or timesheet records",
    "Do not share sensitive payroll, salary, or personal data with unauthorized individuals",
    "Do not use another employee's account or credentials",
    "Do not introduce malicious files or attempt to exploit system vulnerabilities",
    "Do not modify or delete audit logs or system configuration records",
    "Do not bulk export or scrape employee data for unauthorized purposes",
  ];

  const modulesAndRoles = [
    {
      icon: Users,
      title: "Employee Management",
      roles: "HR Admin, System Admin",
      description: "Create, edit, view, and manage employee records including personal data, employment details, and bulk uploads",
    },
    {
      icon: Clock,
      title: "Attendance Management",
      roles: "HR Admin, Employees",
      description: "Record and manage daily attendance, clock in/out, device logs, and attendance corrections",
    },
    {
      icon: FileText,
      title: "Leave Management",
      roles: "HR Admin, Employees",
      description: "Submit leave requests, manage leave types, assign credits, and approve or reject applications",
    },
    {
      icon: BarChart3,
      title: "Payroll Processing",
      roles: "Payroll Admin, HR Admin",
      description: "Generate payroll, manage salary data, process deductions, and generate payslips",
    },
    {
      icon: Shield,
      title: "Recruitment",
      roles: "HR Admin, Evaluators",
      description: "Manage job positions, recruitment workflows, applicant pipeline, interviews, and onboarding",
    },
    {
      icon: ClipboardList,
      title: "KPI & Performance",
      roles: "HR Admin, Evaluators",
      description: "Create KPI templates, assign evaluations, submit scores, and review performance results",
    },
    {
      icon: HeartHandshake,
      title: "Forms & Documents",
      roles: "HR Admin, Employees",
      description: "Create form templates, assign to employees, submit responses, and track completion",
    },
    {
      icon: Lock,
      title: "User & Permissions",
      roles: "System Admin",
      description: "Create user accounts, assign roles and permissions, manage branch access and security settings",
    },
    {
      icon: Fingerprint,
      title: "Device Integration",
      roles: "System Admin",
      description: "Register biometric devices, map device users to employee records, and configure punch log parsing",
    },
    {
      icon: Database,
      title: "Settings & Configuration",
      roles: "System Admin, HR Admin",
      description: "Configure attendance rules, shift schedules, pay rules, approval workflows, notifications, and branding",
    },
  ];

  const accountManagement = [
    {
      icon: UserCheck,
      title: "Unique Accounts",
      description:
        "Each employee receives one account linked to their employee ID. Shared accounts are strictly prohibited.",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description:
        "SYSTEM_ADMIN, ADMIN, HR_USER, PAYROLL_USER, and EMPLOYEE roles with granular per-module permissions including view, create, edit, and delete levels.",
    },
    {
      icon: Clock,
      title: "Account Deactivation",
      description:
        "Accounts are deactivated upon employment termination or resignation. Data is retained per privacy policy.",
    },
    {
      icon: LogOut,
      title: "Session Management",
      description:
        "Sessions expire after inactivity. Users are automatically logged out for security. Concurrent sessions may be restricted.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Terms of Service | HRMS</title>
      </Helmet>

      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="mb-6 gap-2 bg-muted text-foreground hover:bg-muted/80 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
              <Scale className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Please read these terms carefully before using UnivoHR. They govern your use of all system modules.
            </p>
            <div className="flex justify-center mt-4">
              <Badge variant="secondary" className="text-xs">
                Effective Date: June 2026
              </Badge>
            </div>
          </div>

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
                By accessing and using UnivoHR, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the system. Continued use of the system constitutes acceptance of any updates or modifications to these terms.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle>User Responsibilities</CardTitle>
                    <CardDescription>What we expect from all users</CardDescription>
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
                    <CardTitle>Acceptable & Prohibited Use</CardTitle>
                    <CardDescription>Approved and forbidden system usage</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-foreground mb-2">Acceptable Use:</p>
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
                <p className="text-sm font-medium text-foreground mb-2">Prohibited Actions:</p>
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

          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Account Management</CardTitle>
                  <CardDescription>How accounts are managed across the system</CardDescription>
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

          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Module Access by Role</CardTitle>
                  <CardDescription>
                    System modules and the roles authorized to use them
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {modulesAndRoles.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border/50 bg-muted/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs mb-2">
                      {item.roles}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                  Employees are responsible for ensuring their submitted information is accurate across all modules including attendance, leave, overtime, man hours, forms, and KPI self-evaluations. HR personnel and administrators are responsible for verifying and correcting data when necessary. Deliberately providing false information may result in disciplinary action.
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
                  We strive to maintain high availability but do not guarantee uninterrupted access. Scheduled maintenance will be announced in advance when possible. Users should not wait until the last minute to submit time-sensitive requests such as attendance corrections or leave applications.
                </p>
              </CardContent>
            </Card>
          </div>

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
                  We reserve the right to modify these terms at any time to reflect changes in the system, applicable laws, or business practices. Users will be notified of significant changes via email or system announcements. Continued use after changes take effect constitutes acceptance of the updated terms.
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
                  We may suspend or terminate access for violations of these terms, security breaches, employment termination, or unauthorized system use. Termination of access does not relieve users of their responsibilities regarding data accuracy and confidentiality obligations that survive termination.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 shadow-sm bg-primary/5">
            <CardContent className="p-6 text-center">
              <Scale className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">
                Questions About Terms?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                By continuing to use UnivoHR, you acknowledge that you have read, understood, and agree to these Terms of Service covering all system modules.
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