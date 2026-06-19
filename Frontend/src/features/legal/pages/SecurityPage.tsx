import {
  Shield,
  Lock,
  Key,
  Server,
  Eye,
  AlertTriangle,
  CheckCircle,
  Database,
  Fingerprint,
  Globe,
  Clock,
  Bell,
  UserCheck,
  FileSearch,
  RefreshCw,
  Wifi,
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
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

const SecurityPage = () => {
  const navigate = useNavigate();

  const securityFeatures = [
    {
      icon: Lock,
      title: "Password Security",
      description:
        "All passwords are encrypted using bcrypt with 10 salt rounds. Minimum password complexity requirements enforced.",
      badge: "Active",
      badgeColor:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      icon: Key,
      title: "JWT Authentication",
      description:
        "Secure JSON Web Tokens for stateless session management. Tokens are signed and verified on every request.",
      badge: "Active",
      badgeColor:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      icon: Shield,
      title: "Role-Based Access Control",
      description:
        "Granular per-module permissions (view, create, edit, delete, approve) across all 10+ system modules. Branch-level data isolation enforced.",
      badge: "Active",
      badgeColor:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      icon: Clock,
      title: "Session Management",
      description:
        "Automatic timeout after inactivity. Concurrent session detection. Secure logout invalidates tokens immediately.",
      badge: "Active",
      badgeColor:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      icon: FileSearch,
      title: "Audit Logging",
      description:
        "Comprehensive audit trail of all INSERT, UPDATE, and DELETE operations. Captures old values, new values, user ID, IP address, and timestamp.",
      badge: "Active",
      badgeColor:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
    {
      icon: Database,
      title: "SQL Injection Prevention",
      description:
        "All database queries use parameterized prepared statements. Raw SQL concatenation is prohibited in the codebase.",
      badge: "Active",
      badgeColor:
        "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    },
    {
      icon: UserCheck,
      title: "Permission Middleware",
      description:
        "Every API endpoint is protected by authentication and permission middleware. Unauthorized requests are rejected with 403.",
      badge: "Active",
      badgeColor:
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
    {
      icon: Wifi,
      title: "Device API Security",
      description:
        "Biometric device connections use per-device API keys. Device keys are hashed and stored securely.",
      badge: "Active",
      badgeColor:
        "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    },
  ];

  const dataProtection = [
    {
      icon: Database,
      title: "Encryption at Rest",
      description: "Sensitive data fields encrypted in the database",
    },
    {
      icon: Globe,
      title: "TLS/SSL Encryption",
      description: "HTTPS for all frontend-to-backend data transmission",
    },
    {
      icon: Server,
      title: "Regular Backups",
      description: "Automated daily database backups with retention policy",
    },
    {
      icon: Eye,
      title: "Audit Logging",
      description: "Complete immutable trail of all user actions across modules",
    },
    {
      icon: Fingerprint,
      title: "Input Validation",
      description: "Server-side validation and sanitization on all endpoints",
    },
    {
      icon: Lock,
      title: "Branch Isolation",
      description: "Multi-branch data segregation via branch access middleware",
    },
    {
      icon: RefreshCw,
      title: "Account Lockout",
      description: "Account lockout after repeated failed login attempts",
    },
    {
      icon: Bell,
      title: "Anomaly Detection",
      description: "Statistical anomaly detection for unusual attendance patterns",
    },
  ];

  const apiSecurity = [
    "All API endpoints require valid JWT authentication tokens",
    "Rate limiting prevents brute force and abuse attacks",
    "Input validation and sanitization on all request parameters",
    "SQL injection prevention through parameterized queries",
    "Permission middleware checks on every protected route",
    "Device API keys are hashed using bcrypt before storage",
    "CORS configuration restricts cross-origin requests",
    "File upload validation limits file types and sizes",
  ];

  const infrastructureSecurity = [
    "Regular security patches and dependency updates",
    "Firewall and network-level protection",
    "Isolated database environment with restricted access",
    "24/7 monitoring of critical system components",
    "Environment-specific configuration (development, staging, production)",
    "Secure environment variable management for secrets",
    "Docker containerization for consistent deployment",
    "Health check endpoints for system monitoring",
  ];

  const bestPractices = [
    "Use a strong, unique password with at least 8 characters including letters, numbers, and symbols",
    "Never share your login credentials with anyone",
    "Always log out or lock your workstation when leaving",
    "Report suspicious activity or potential security incidents immediately",
    "Keep your browser and operating system updated",
    "Do not access the system from public or untrusted networks",
    "Use the password reset feature if you suspect your account is compromised",
    "Review your own data periodically for accuracy",
  ];

  return (
    <>
      <Helmet>
        <title>Security | HRMS</title>
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
              Security
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your data security is our top priority. Learn how UnivoHR protects your information across all modules.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {securityFeatures.map((feature, index) => (
              <Card
                key={index}
                className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {feature.title}
                        </CardTitle>
                      </div>
                    </div>
                    <Badge className={feature.badgeColor}>
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Data Protection</CardTitle>
                  <CardDescription>
                    Comprehensive safeguards for your information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {dataProtection.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center p-4 rounded-lg border border-border/50 bg-muted/20"
                  >
                    <div className="p-2 rounded-full bg-primary/10 mb-3">
                      <item.icon className="h-5 w-5 text-primary" />
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

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle>User Best Practices</CardTitle>
                    <CardDescription>
                      Recommendations for staying secure
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bestPractices.map((practice, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {practice}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle>Incident Response</CardTitle>
                    <CardDescription>
                      How we handle security events
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Bell className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Immediate notification of security breaches to administrators
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Server className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Rapid containment, investigation, and remediation procedures
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Eye className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Affected users and stakeholders are notified promptly
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Post-incident review and security improvements implemented
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>API Security</CardTitle>
                    <CardDescription>Protecting our endpoints</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {apiSecurity.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Infrastructure Security</CardTitle>
                    <CardDescription>Our security stack</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {infrastructureSecurity.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Permission Model Section */}
          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Permission Model</CardTitle>
                  <CardDescription>
                    Granular access control across all modules
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-3">
                <p>
                  UnivoHR implements a multi-layered permission model that controls access at the module, action, and data levels:
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                    <h4 className="font-medium text-foreground text-xs mb-1">Module-Level Permissions</h4>
                    <p className="text-xs">Each module (Employees, Attendance, Payroll, Leave, etc.) has independent view, create, edit, and delete permissions.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                    <h4 className="font-medium text-foreground text-xs mb-1">Branch-Level Isolation</h4>
                    <p className="text-xs">Users can be restricted to specific branches. Data from other branches is invisible.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                    <h4 className="font-medium text-foreground text-xs mb-1">Role Hierarchy</h4>
                    <p className="text-xs">SYSTEM_ADMIN has full access. ADMIN, HR_USER, PAYROLL_USER, and EMPLOYEE roles have progressively scoped permissions.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-primary/5">
            <CardContent className="p-6 text-center">
              <Fingerprint className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Security Concerns?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For security concerns or to report a vulnerability, please contact your system administrator immediately.
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

export default SecurityPage;