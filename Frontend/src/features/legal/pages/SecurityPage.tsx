// features/legal/pages/SecurityPage.tsx
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
        "All passwords are encrypted using bcrypt with 10 salt rounds",
      badge: "Active",
      badgeColor:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      icon: Key,
      title: "JWT Authentication",
      description: "Secure JSON Web Tokens for stateless session management",
      badge: "Active",
      badgeColor:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      icon: Shield,
      title: "Role-Based Access Control",
      description:
        "ADMIN, HR_ADMIN, HR, and EMPLOYEE roles with granular permissions",
      badge: "Active",
      badgeColor:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      icon: Clock,
      title: "Session Management",
      description: "Automatic timeout and logout after period of inactivity",
      badge: "Active",
      badgeColor:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
  ];

  const dataProtection = [
    {
      icon: Database,
      title: "Encryption at Rest",
      description: "All sensitive data is encrypted in the database",
    },
    {
      icon: Globe,
      title: "TLS/SSL Encryption",
      description: "HTTPS for all data transmission",
    },
    {
      icon: Server,
      title: "Regular Backups",
      description: "Automated daily database backups",
    },
    {
      icon: Eye,
      title: "Audit Logging",
      description: "Complete trail of all user actions",
    },
  ];

  const bestPractices = [
    "Use a strong, unique password",
    "Never share your login credentials",
    "Log out when leaving your workstation",
    "Report suspicious activity immediately",
    "Keep your browser updated",
    "Enable two-factor authentication when available",
  ];

  return (
    <>
      <Helmet>
        <title>Security | HRMS</title>
      </Helmet>

      <div className="min-h-screen bg-linear-to-brrom-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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
              Security
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your data security is our top priority. Learn how we protect your
              information.
            </p>
          </div>

          {/* Security Features Grid */}
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

          {/* Data Protection Section */}
          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Data Protection</CardTitle>
                  <CardDescription>
                    How we safeguard your information
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

          {/* Best Practices & Incident Response */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Best Practices */}
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

            {/* Incident Response */}
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
                    Immediate notification of security breaches
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Server className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Rapid containment and investigation procedures
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Eye className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Affected users are notified promptly
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Regular security drills and testing
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Security & Infrastructure */}
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
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    All API endpoints require authentication
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Rate limiting to prevent abuse
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Input validation and sanitization
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    SQL injection prevention (parameterized queries)
                  </span>
                </div>
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
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Regular security patches and updates
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Firewall and DDoS protection
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Isolated database environment
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    24/7 monitoring of critical systems
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <Card className="border-border/50 shadow-sm bg-primary/5">
            <CardContent className="p-6 text-center">
              <Fingerprint className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Security Concerns?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For security concerns or to report a vulnerability, please
                contact your system administrator immediately.
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
