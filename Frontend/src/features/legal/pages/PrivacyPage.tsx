import {
  Shield,
  Users,
  Database,
  Eye,
  Lock,
  FileText,
  Mail,
  CheckCircle,
  Clock,
  Fingerprint,
  Camera,
  ClipboardList,
  GraduationCap,
  BarChart3,
  HeartHandshake,
  Bell,
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

const PrivacyPage = () => {
  const navigate = useNavigate();

  const dataCollected = [
    {
      icon: Users,
      title: "Personal & Account Information",
      items: [
        "Full name, email address, contact number",
        "Employee ID and government IDs (SSS, PhilHealth, Pag-IBIG, TIN)",
        "Username and hashed password credentials",
        "Profile photo and emergency contact details",
      ],
    },
    {
      icon: Database,
      title: "Employment & HR Records",
      items: [
        "Department, position, branch assignment",
        "Hire date, employment status, regularization date",
        "Salary, pay rates, and compensation history",
        "Employment history, education, and certifications",
      ],
    },
    {
      icon: Clock,
      title: "Attendance & Time Data",
      items: [
        "Daily clock-in and clock-out times",
        "Biometric and RFID device logs",
        "Leave requests, credits, and balances",
        "Overtime requests and man-hour reports",
      ],
    },
    {
      icon: Fingerprint,
      title: "Biometric & Device Data",
      items: [
        "Fingerprint templates (if enrolled on devices)",
        "RFID card identifiers",
        "Device user mappings and punch logs",
        "Face recognition data if applicable",
      ],
    },
    {
      icon: ClipboardList,
      title: "Recruitment & Applicant Data",
      items: [
        "Job applications and resumes",
        "Interview evaluations and scores",
        "Applicant workflow stage history",
        "Onboarding requirements and documents",
      ],
    },
    {
      icon: BarChart3,
      title: "Performance & KPI Data",
      items: [
        "KPI evaluation templates and scores",
        "Performance review results",
        "Evaluator comments and recommendations",
        "Employee regularization and termination records",
      ],
    },
    {
      icon: FileText,
      title: "HR Forms & Documents",
      items: [
        "Submitted HR forms (clearance, resignation, etc.)",
        "Company policy acknowledgment records",
        "Form templates and assigned submissions",
        "Document uploads and attachments",
      ],
    },
    {
      icon: HeartHandshake,
      title: "Payroll & Benefits Data",
      items: [
        "Basic salary, allowances, and deductions",
        "Government contributions (SSS, PhilHealth, Pag-IBIG)",
        "Payslip history and payroll registers",
        "Company benefits and entitlements",
      ],
    },
    {
      icon: Eye,
      title: "Audit & Activity Logs",
      items: [
        "User login timestamps and IP addresses",
        "All data changes tracked with old and new values",
        "System configuration changes",
        "Permission and role assignment history",
      ],
    },
    {
      icon: Bell,
      title: "Communication & Notification Data",
      items: [
        "In-app notification preferences and history",
        "Email notification settings",
        "Approval request and response records",
        "System announcement acknowledgments",
      ],
    },
  ];

  const dataUsage = [
    "Process payroll and calculate salary disbursements",
    "Track daily attendance, leaves, overtime, and man hours",
    "Generate HR reports and analytics across all modules",
    "Manage recruitment pipeline from application to onboarding",
    "Evaluate employee performance through KPI reviews",
    "Administer employee benefits and government contributions",
    "Communicate important updates, approvals, and announcements",
    "Maintain employment records for legal and compliance purposes",
    "Conduct security audits and investigate anomalies",
    "Assign and track HR forms and policy acknowledgments",
  ];

  const accessRights = [
    {
      role: "Employees",
      access: "Can only view their own personal data, attendance, payslips, and submitted forms",
      icon: Users,
    },
    {
      role: "HR Personnel",
      access: "Can view and manage employee data, attendance, leaves, recruitment, and forms for HR operations",
      icon: Shield,
    },
    {
      role: "Payroll Users",
      access: "Can access salary, deductions, payroll processing, and payslip generation",
      icon: Lock,
    },
    {
      role: "System Administrators",
      access: "Full system access including settings, permissions, audit logs, and all modules",
      icon: Lock,
    },
  ];

  const dataRetention = [
    "Attendance and device logs are retained for the duration of employment plus applicable legal requirements",
    "Payroll records are retained as required by labor laws and tax regulations",
    "Audit logs are retained for security monitoring and compliance purposes",
    "Personal data is deleted or anonymized within a reasonable period after employment ends",
    "Applicant data is retained for the duration of the recruitment process plus a defined period",
  ];

  const yourRights = [
    "Access and review your personal and employment data",
    "Request corrections to inaccurate or outdated information",
    "Request deletion of your data (subject to legal and business retention requirements)",
    "Receive notifications about policy changes that affect your data",
    "Opt-out of non-essential communications",
    "Request a copy of your data in a portable format",
    "File a complaint regarding data handling practices",
  ];

  return (
    <>
      <Helmet>
        <title>Privacy Policy | HRMS</title>
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
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your privacy matters. Learn how UnivoHR collects, uses, and protects your information across all modules.
            </p>
            <div className="flex justify-center mt-4">
              <Badge variant="secondary" className="text-xs">
                Last updated: June 2026
              </Badge>
            </div>
          </div>

          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Information We Collect</CardTitle>
                  <CardDescription>
                    Types of data we gather across all system modules to provide our services
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {dataCollected.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border/50 bg-muted/20"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <item.icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                    </div>
                    <div className="space-y-1">
                      {item.items.map((subItem, subIndex) => (
                        <div
                          key={subIndex}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <div className="w-1 h-1 rounded-full bg-primary/50 mt-2 shrink-0" />
                          <span>{subItem}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  Account credentials (username and password) are securely hashed using bcrypt. Biometric data is stored only on registered devices, not in the application database.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>How We Use Your Information</CardTitle>
                  <CardDescription>
                    Purpose of data collection and processing across all modules
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {dataUsage.map((item, index) => (
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

          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Data Access & Sharing</CardTitle>
                  <CardDescription>
                    Who can access your information across the system
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {accessRights.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border/50 text-center"
                  >
                    <div className="flex justify-center mb-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{item.role}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.access}
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  We do not sell or share your personal data with third parties. Data is shared only when required by law, with your explicit consent, or with authorized system personnel on a need-to-know basis.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Data Protection</CardTitle>
                  <CardDescription>
                    How we keep your data secure across all modules
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    All passwords encrypted using bcrypt with salt rounds
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    JWT-based authentication for all API requests
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Role-based access control (RBAC) for granular data permissions
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Branch-level data isolation for multi-branch companies
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    HTTPS/TLS encryption for all data transmission
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Parameterized queries to prevent SQL injection
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Comprehensive audit logging of all data changes
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Input validation and sanitization on all endpoints
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Data Retention</CardTitle>
                  <CardDescription>
                    How long we keep your information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dataRetention.map((item, index) => (
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

          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Your Rights</CardTitle>
                  <CardDescription>
                    Control over your personal data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {yourRights.map((right, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {right}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-primary/5">
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">
                Questions About Privacy?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                For privacy concerns or data requests, please contact your HR department or system administrator.
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

export default PrivacyPage;