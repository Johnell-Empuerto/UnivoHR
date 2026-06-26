import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, BookOpen, LayoutDashboard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import smallIcon from "@/assets/images/small-icon.png";
import { useAuth } from "@/app/providers/AuthProvider";
import { isApprover as checkIsApprover } from "@/services/overtimeService";
import DocsSidebar from "../components/DocsSidebar";

const docPageTitles: Record<string, string> = {
  overview: "Overview",
  "first-admin-login": "First Admin Login Guide",
  login: "Login",
  dashboard: "Dashboard",
  attendance: "Attendance",
  leaves: "Leaves",
  calendar: "Calendar",
  "man-hours": "Man-Hours",
  overtime: "Overtime",
  "payroll-admin": "Payroll Admin",
  employees: "Employees",
  users: "Accounts",
  settings: "Settings",
  profile: "Profile",
};

const DOCS_MODULE_COUNT = 64;

const DocsLayout = () => {
  const { isAuth, user } = useAuth();
  const [, setIsUserApprover] = useState(false);
  const [approverLoading, setApproverLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const segment =
    location.pathname.split("/docs/")[1]?.replace(/\/$/, "") || "";
  const pageTitle = docPageTitles[segment];

  useEffect(() => {
    if (!isAuth || !user?.id) {
      setIsUserApprover(false);
      return;
    }
    if (user.role === "ADMIN") {
      setIsUserApprover(false);
      return;
    }
    let cancelled = false;
    setApproverLoading(true);
    checkIsApprover()
      .then((result) => {
        if (!cancelled) setIsUserApprover(result.isApprover);
      })
      .catch(() => {
        if (!cancelled) setIsUserApprover(false);
      })
      .finally(() => {
        if (!cancelled) setApproverLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuth, user?.id, user?.role]);

  const handleBack = () => {
    navigate(isAuth ? "/dashboard" : "/login");
  };

  const backLabel = isAuth ? "Back to Dashboard" : "Back to Login";

  if (location.pathname === "/docs" || location.pathname === "/docs/") {
    return <Navigate to="/docs/overview" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle ? `${pageTitle} | ` : ""}User Manual | UnivoHR</title>
      </Helmet>

      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={smallIcon}
                alt="UnivoHR"
                className="h-6 w-6 object-contain dark:brightness-0 dark:invert shrink-0"
              />
              <span className="font-bold text-foreground truncate">
                UnivoHR
              </span>
              <Badge
                variant="outline"
                className="hidden sm:inline-flex text-xs"
              >
                User Manual
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex gap-2 text-muted-foreground"
                onClick={handleBack}
              >
                {isAuth ? (
                  <LayoutDashboard className="h-4 w-4" />
                ) : (
                  <ArrowLeft className="h-4 w-4" />
                )}
                {backLabel}
              </Button>
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Open table of contents"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-72 p-4 overflow-y-auto"
                  >
                    <DocsSidebar
                      activePath={location.pathname}
                      onNavigate={(path) => navigate(path)}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6 gap-2 sm:hidden bg-muted text-foreground hover:bg-muted/80"
          >
            {isAuth ? (
              <LayoutDashboard className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
            {backLabel}
          </Button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
              UnivoHR User Manual
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Step-by-step guides for every module in this HRIS — based only on
              features present in the application.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="secondary">
                {isAuth ? "Personalized for you" : "Public — no login required"}
              </Badge>
              <Badge variant="outline">{DOCS_MODULE_COUNT} modules</Badge>
              {approverLoading && isAuth && user?.role === "EMPLOYEE" && (
                <Badge variant="outline">Checking approver access…</Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-20 rounded-xl border border-border/50 bg-card/80 backdrop-blur p-4 max-h-[calc(100vh-6rem)] overflow-y-auto shadow-sm">
                <DocsSidebar
                  activePath={location.pathname}
                  onNavigate={(path) => navigate(path)}
                />
              </div>
            </aside>

            <main className="flex-1 min-w-0 space-y-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocsLayout;
