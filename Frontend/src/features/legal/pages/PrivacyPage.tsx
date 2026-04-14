// features/legal/pages/PrivacyPage.tsx
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

const PrivacyPage = () => {
  const navigate = useNavigate();

  const dataCollected = [
    {
      icon: Database,
      title: "Personal Information",
      items: ["Name", "Email address", "Employee ID", "Contact number"],
    },
    {
      icon: Users,
      title: "Employment Data",
      items: ["Department", "Position", "Hire date", "Salary information"],
    },
    {
      icon: Clock,
      title: "Attendance Records",
      items: ["Check-in/out times", "Leaves", "Overtime", "Absences"],
    },
    {
      icon: FileText,
      title: "Payroll Information",
      items: ["Salary", "Deductions", "Bonuses", "Government contributions"],
    },
  ];

  const dataUsage = [
    "Process payroll and salary calculations",
    "Track attendance, leaves, and overtime",
    "Generate reports for HR and management",
    "Communicate important updates and announcements",
    "Maintain employment records and compliance",
  ];

  const accessRights = [
    {
      role: "Employees",
      access: "Can only view their own personal data",
      icon: Users,
    },
    {
      role: "HR Personnel",
      access: "Can view employee data for HR operations",
      icon: Shield,
    },
    {
      role: "Administrators",
      access: "Full system access for management",
      icon: Lock,
    },
  ];

  const yourRights = [
    "Access and review your personal data",
    "Request corrections to inaccurate information",
    "Request deletion of your data (subject to legal retention)",
    "Receive notifications about policy changes",
    "Opt-out of non-essential communications",
  ];

  return (
    <>
      <Helmet>
        <title>Privacy | HRMS</title>
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
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your privacy matters. Learn how we collect, use, and protect your
              information.
            </p>
            <div className="flex justify-center mt-4">
              <Badge variant="secondary" className="text-xs">
                Last updated: April 2026
              </Badge>
            </div>
          </div>

          {/* Information We Collect */}
          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Information We Collect</CardTitle>
                  <CardDescription>
                    Types of data we gather to provide our services
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
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <div className="w-1 h-1 rounded-full bg-primary/50" />
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
                  Account credentials (username and password) are securely
                  hashed using bcrypt
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>How We Use Your Information</CardTitle>
                  <CardDescription>
                    Purpose of data collection and processing
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

          {/* Data Access & Sharing */}
          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Data Access & Sharing</CardTitle>
                  <CardDescription>
                    Who can access your information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
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
                  We do not sell or share your personal data with third parties.
                  Data is shared only when required by law or with your consent.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Data Protection</CardTitle>
                  <CardDescription>
                    How we keep your data secure
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    All passwords are encrypted using bcrypt hashing
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Role-based access control (RBAC) for data security
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Regular security audits and updates
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Secure HTTPS connections for all data transmission
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
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

          {/* Contact Section */}
          <Card className="border-border/50 shadow-sm bg-primary/5">
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">
                Questions About Privacy?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                For privacy concerns or data requests, please contact your HR
                department or system administrator.
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
