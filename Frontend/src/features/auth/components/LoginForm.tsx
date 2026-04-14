import { Button } from "@/components/ui/Button";
import { login as loginAPI } from "@/services/authService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Loader2,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Moon,
  Sun,
  Users,
  ArrowRight,
  Shield,
  Zap,
  BarChart3,
} from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import smallIcon from "@/assets/images/small-icon.png";
import OTPVerification from "./OTPVerification";

// Counter animation hook
const useCountUp = (
  targetValue: number,
  duration: number = 2000,
  suffix: string = "",
  prefix: string = "",
) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = targetValue * easeOutQuart;
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(targetValue);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isVisible, targetValue, duration]);

  const formatValue = () => {
    const rounded = Math.round(count);
    if (suffix === "%") return `${rounded}${suffix}`;
    if (prefix === "$") return `$${rounded.toLocaleString()}`;
    return rounded.toLocaleString();
  };

  return { count: formatValue(), ref: elementRef };
};

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });

  // 2FA States
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  // Counter values
  const attendanceRate = useCountUp(94.8, 2000, "%");
  const pendingLeaves = useCountUp(12, 1500, "");
  const totalEmployees = useCountUp(156, 1800, "");
  const monthlyPayroll = useCountUp(21845, 2000, "", "$");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      const res = await loginAPI(form);

      if (res.requires_2fa) {
        setUserId(res.user_id ?? null);
        setMaskedEmail(res.masked_email ?? null);
        setRequires2FA(true);
        toast.info(res.message || "Verification code sent to your email");
      } else {
        if (!res.token) {
          throw new Error("Token missing from server response");
        }
        login({ token: res.token });
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || "Invalid credentials",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = (token: string) => {
    if (!token) {
      toast.error("Invalid verification response");
      return;
    }
    login({ token });
    toast.success("Welcome back!");
    navigate("/dashboard");
  };

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setUserId(null);
    setMaskedEmail(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-brrom-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-start md:items-center md:justify-center px-2 py-4 md:p-8 lg:p-10 w-full">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-slate-700" />
        )}
      </button>

      <div className="grid lg:grid-cols-2 gap-6 md:gap-10 lg:gap-16 max-w-7xl w-full">
        {/* Left Column - Hero Section - ALWAYS VISIBLE */}
        <div className="hidden md:flex lg:flex flex-col justify-center space-y-8">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <img
                  src={smallIcon}
                  alt="UnivoHR Logo"
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  UnivoHR
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enterprise HR & Payroll Solution
                </p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Complete attendance tracking, leave management, and automated
              payroll system for modern businesses.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-5 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-brrom-primary/5 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Attendance Rate
                  </p>
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <p
                  ref={attendanceRate.ref}
                  className="text-3xl font-bold bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent"
                >
                  {attendanceRate.count}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ↑ 2.4% from last month
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-5 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-brrom-amber-500/5 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Leaves
                  </p>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
                <p
                  ref={pendingLeaves.ref}
                  className="text-3xl font-bold text-amber-600 dark:text-amber-400"
                >
                  {pendingLeaves.count}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Awaiting approval
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-5 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-blue-500/5 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Employees
                  </p>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <p
                  ref={totalEmployees.ref}
                  className="text-3xl font-bold text-blue-600 dark:text-blue-400"
                >
                  {totalEmployees.count}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Active workforce
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-5 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-violet-500/5 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Monthly Payroll
                  </p>
                  <DollarSign className="h-5 w-5 text-violet-500" />
                </div>
                <p
                  ref={monthlyPayroll.ref}
                  className="text-3xl font-bold text-violet-600 dark:text-violet-400"
                >
                  {monthlyPayroll.count}
                </p>
                <p className="text-xs text-muted-foreground mt-2">This month</p>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="p-1 rounded-full bg-primary/10">
                <Shield className="h-3 w-3 text-primary" />
              </div>
              <span>Secure & Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="p-1 rounded-full bg-primary/10">
                <Zap className="h-3 w-3 text-primary" />
              </div>
              <span>Real-time Sync</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="p-1 rounded-full bg-primary/10">
                <BarChart3 className="h-3 w-3 text-primary" />
              </div>
              <span>Analytics Dashboard</span>
            </div>
          </div>
        </div>

        {/* Right Column - Login/OTP Form - SAME POSITION FOR BOTH */}
        <div className="flex items-center justify-center w-full">
          {requires2FA ? (
            <OTPVerification
              userId={userId!}
              maskedEmail={maskedEmail ?? undefined}
              onVerify={handleVerifyOTP}
              onBack={handleBackToLogin}
            />
          ) : (
            <Card className="w-full border-slate-200 dark:border-slate-800 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center pt-6">
                <div className="flex items-center gap-2">
                  <img
                    src={smallIcon}
                    alt="UnivoHR Logo"
                    className="h-8 w-8 object-contain"
                  />
                  <span className="text-xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    UnivoHR
                  </span>
                </div>
              </div>

              <CardHeader className="space-y-1 pt-3 pb-2 md:pt-6 md:pb-4">
                <CardTitle className="text-2xl font-semibold tracking-tight text-center lg:text-left">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-center lg:text-left">
                  Sign in to access your dashboard
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Email / Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      placeholder="Enter your email or username"
                      disabled={isLoading}
                      className="h-11 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      placeholder="Enter your password"
                      disabled={isLoading}
                      className="h-11 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 font-medium group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
                <p className="text-xs text-muted-foreground text-center">
                  Need help?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() =>
                      toast.info(
                        "Please contact your administrator for assistance.",
                      )
                    }
                  >
                    Contact Support
                  </button>
                </p>

                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                  <button
                    type="button"
                    className="hover:text-foreground transition-colors"
                    onClick={() => navigate("/privacy")}
                  >
                    Privacy
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    className="hover:text-foreground transition-colors"
                    onClick={() => navigate("/terms")}
                  >
                    Terms
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    className="hover:text-foreground transition-colors"
                    onClick={() => navigate("/security")}
                  >
                    Security
                  </button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
