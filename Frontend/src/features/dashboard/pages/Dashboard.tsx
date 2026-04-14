// features/dashboard/pages/Dashboard.tsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  getDashboardSummary,
  getTodayStatus,
  getAdminAnalytics,
  getMyAnalytics,
} from "@/services/dashboardService";
import { leaveService } from "@/services/leaveService";
import StatsCard from "../components/StatsCard";
import AttendanceChart from "../components/AttendanceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Clock,
  UserX,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  CalendarDays,
  Heart,
  Shield,
  Activity,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";
import AttendanceTrendChart from "../components/AttendanceTrendChart";
import EmployeeGrowthChart from "@/features/dashboard/components/EmployeeGrowthChart";
import AbsentTrendChart from "@/features/dashboard/components/AbsentTrendChart";
import DailyBreakdownStackedBar from "../components/DailyBreakdownStackedBar";
import InsightsPanel from "../components/InsightsPanel";
import React from "react";

interface LeaveCredits {
  sick_leave_remaining: number;
  vacation_leave_remaining: number;
  emergency_leave_remaining: number;
  maternity_leave_remaining: number;
  sick_leave: number;
  vacation_leave: number;
  emergency_leave: number;
  maternity_leave: number;
}

interface RecentLeave {
  id: number;
  type: string;
  from_date: string;
  to_date: string;
  status: string;
  reason: string;
}

// Extract Admin Dashboard to separate memoized component
const AdminDashboardContent = React.memo(
  ({ summary, adminAnalytics, metrics }: any) => {
    //  MEMOIZE all data transformations - CRITICAL FIX
    const dailyBreakdownData = useMemo(() => {
      return (
        adminAnalytics?.daily_breakdown?.map((day: any) => ({
          day: new Date(day.date).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          present: Number(day.present) || 0,
          late: Number(day.late) || 0,
          absent: Number(day.absent) || 0,
          leave: Number(day.leave) || 0,
        })) || []
      );
    }, [adminAnalytics?.daily_breakdown]);

    const weeklyTrendData = useMemo(() => {
      return (
        adminAnalytics?.weekly_trend?.map((item: any) => ({
          day: item.day,
          present: Number(item.present) || 0,
          late: Number(item.late) || 0,
          absent: Number(item.absent) || 0,
          leave: Number(item.on_leave) || 0,
        })) || []
      );
    }, [adminAnalytics?.weekly_trend]);

    const employeeGrowthData = useMemo(() => {
      return adminAnalytics?.employee_growth || [];
    }, [adminAnalytics?.employee_growth]);

    const absentTrendData = useMemo(() => {
      return adminAnalytics?.absent_trend || [];
    }, [adminAnalytics?.absent_trend]);

    const trends = useMemo(
      () => ({
        present: Number(adminAnalytics?.trends?.present) || 0,
        late: Number(adminAnalytics?.trends?.late) || 0,
        absent: Number(adminAnalytics?.trends?.absent) || 0,
        leave: Number(adminAnalytics?.trends?.on_leave) || 0,
      }),
      [adminAnalytics?.trends],
    );

    return (
      <div className="space-y-6 p-6">
        {/* Header - Matching consistent theme */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Overview of company attendance and performance metrics
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Present Today"
            value={summary?.present || 0}
            icon={<Users className="h-4 w-4 text-green-600" />}
            color="green"
            trend={trends.present}
          />
          <StatsCard
            title="Late Today"
            value={summary?.late || 0}
            icon={<Clock className="h-4 w-4 text-yellow-600" />}
            color="yellow"
            trend={trends.late}
          />
          <StatsCard
            title="Absent Today"
            value={summary?.absent || 0}
            icon={<UserX className="h-4 w-4 text-red-600" />}
            color="red"
            trend={trends.absent}
          />
          <StatsCard
            title="On Leave Today"
            value={summary?.on_leave || 0}
            icon={<Calendar className="h-4 w-4 text-blue-600" />}
            color="blue"
            trend={trends.leave}
          />
        </div>

        {/* Weekly Attendance Trend */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Weekly Attendance Trend
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily attendance patterns throughout the week
              </p>
            </CardHeader>
            <CardContent>
              <AttendanceTrendChart data={weeklyTrendData} />
            </CardContent>
          </Card>
        </div>

        {/* Daily Breakdown Chart */}
        <div className="grid grid-cols-1 gap-6">
          <DailyBreakdownStackedBar data={dailyBreakdownData} />
        </div>

        {/* Advanced Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {employeeGrowthData.length > 0 && (
            <EmployeeGrowthChart data={employeeGrowthData} />
          )}
          {absentTrendData.length > 0 && (
            <AbsentTrendChart data={absentTrendData} />
          )}
        </div>

        {/* Insights Panel */}
        {/* Insights Panel - NOW SIMPLER */}
        {summary && metrics && adminAnalytics?.insights && (
          <InsightsPanel insights={adminAnalytics.insights} />
        )}
      </div>
    );
  },
);

//  Extract Employee Dashboard to separate memoized component
const EmployeeDashboardContent = React.memo(
  ({
    user,
    summary,
    today,
    leaveCredits,
    recentLeaves,
    employeeTrends,
    navigate,
  }: any) => {
    return (
      <div className="space-y-6 p-6">
        {/* Header - Matching consistent theme */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back,{" "}
              {user?.first_name || user?.name?.split(" ")[0] || "User"}! Here's
              your attendance overview
            </p>
          </div>
        </div>

        {/* Today Status Card */}
        {today && (
          <Card className="border-border/50 shadow-sm bg-linear-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Today's Status
                  </p>
                  <p className="text-3xl font-bold">
                    {today.status || "No Record"}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Check-in</p>
                      <p className="font-medium">
                        {today.check_in_time
                          ? new Date(today.check_in_time).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "--:--"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Check-out</p>
                      <p className="font-medium">
                        {today.check_out_time
                          ? new Date(today.check_out_time).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "--:--"}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center ${
                    today.status === "PRESENT"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : today.status === "LATE"
                        ? "bg-yellow-100 dark:bg-yellow-900/30"
                        : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Row */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Present Days"
              value={summary.present || 0}
              icon={<Users className="h-4 w-4 text-green-600" />}
              color="green"
              trend={employeeTrends?.present}
            />
            <StatsCard
              title="Late Days"
              value={summary.late || 0}
              icon={<Clock className="h-4 w-4 text-yellow-600" />}
              color="yellow"
              trend={employeeTrends?.late}
            />
            <StatsCard
              title="Absent Days"
              value={summary.absent || 0}
              icon={<XCircle className="h-4 w-4 text-red-600" />}
              color="red"
              trend={employeeTrends?.absent}
            />
            <StatsCard
              title="Leave Days"
              value={summary.on_leave || 0}
              icon={<Calendar className="h-4 w-4 text-blue-600" />}
              color="blue"
              trend={employeeTrends?.on_leave}
            />
          </div>
        )}

        {/* Attendance Chart */}
        {summary && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                My Attendance Overview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your attendance distribution this month
              </p>
            </CardHeader>
            <CardContent>
              <AttendanceChart data={summary} />
            </CardContent>
          </Card>
        )}

        {/* Leave Balance & Recent Leaves */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leave Balance Card */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Leave Balance
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your remaining leave credits
              </p>
            </CardHeader>
            <CardContent>
              {leaveCredits ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Sick Leave</p>
                        <p className="text-xs text-muted-foreground">
                          Available
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {leaveCredits.sick_leave_remaining}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        / {leaveCredits.sick_leave} days
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">Vacation Leave</p>
                        <p className="text-xs text-muted-foreground">
                          Available
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {leaveCredits.vacation_leave_remaining}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        / {leaveCredits.vacation_leave} days
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium">Emergency Leave</p>
                        <p className="text-xs text-muted-foreground">
                          Available
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {leaveCredits.emergency_leave_remaining}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        / {leaveCredits.emergency_leave} days
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-pink-600" />
                      <div>
                        <p className="text-sm font-medium">Maternity Leave</p>
                        <p className="text-xs text-muted-foreground">
                          Available
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {leaveCredits.maternity_leave_remaining}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        / {leaveCredits.maternity_leave} days
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => navigate("/leaves")}
                  >
                    Request Leave
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No leave credits data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Leaves Card */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Recent Leave Requests
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your latest leave applications
              </p>
            </CardHeader>
            <CardContent>
              {recentLeaves.length > 0 ? (
                <div className="space-y-3">
                  {recentLeaves.map(
                    (leave: {
                      id: React.Key | null | undefined;
                      type:
                        | string
                        | number
                        | bigint
                        | boolean
                        | React.ReactElement<
                            unknown,
                            string | React.JSXElementConstructor<any>
                          >
                        | Iterable<React.ReactNode>
                        | React.ReactPortal
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | React.ReactPortal
                            | React.ReactElement<
                                unknown,
                                string | React.JSXElementConstructor<any>
                              >
                            | Iterable<React.ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined;
                      status:
                        | string
                        | number
                        | bigint
                        | boolean
                        | React.ReactElement<
                            unknown,
                            string | React.JSXElementConstructor<any>
                          >
                        | Iterable<React.ReactNode>
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | React.ReactPortal
                            | React.ReactElement<
                                unknown,
                                string | React.JSXElementConstructor<any>
                              >
                            | Iterable<React.ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined;
                      from_date: string | number | Date;
                      to_date: string | number | Date;
                      reason:
                        | string
                        | number
                        | bigint
                        | boolean
                        | React.ReactElement<
                            unknown,
                            string | React.JSXElementConstructor<any>
                          >
                        | Iterable<React.ReactNode>
                        | React.ReactPortal
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | React.ReactPortal
                            | React.ReactElement<
                                unknown,
                                string | React.JSXElementConstructor<any>
                              >
                            | Iterable<React.ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined;
                    }) => (
                      <div
                        key={leave.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{leave.type}</p>
                            <Badge
                              variant={
                                leave.status === "APPROVED"
                                  ? "default"
                                  : leave.status === "REJECTED"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {leave.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(leave.from_date).toLocaleDateString()} -{" "}
                            {new Date(leave.to_date).toLocaleDateString()}
                          </p>
                          {leave.reason && (
                            <p className="text-xs text-muted-foreground truncate max-w-50">
                              {leave.reason}
                            </p>
                          )}
                        </div>
                        {leave.status === "APPROVED" && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {leave.status === "REJECTED" && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        {leave.status === "PENDING" && (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                    ),
                  )}
                  <Button
                    variant="ghost"
                    className="w-full mt-2"
                    onClick={() => navigate("/leaves")}
                  >
                    View All Leaves
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No leave requests found
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/leaves")}
                  >
                    Request Leave
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Quick Actions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Frequently used actions
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/attendance")}
              >
                <Clock className="h-5 w-5" />
                <span className="text-sm">View Attendance</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/leaves")}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-sm">Request Leave</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/profile")}
              >
                <Users className="h-5 w-5" />
                <span className="text-sm">My Profile</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/reports")}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
);

// Main Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [today, setToday] = useState<any>(null);
  const [leaveCredits, setLeaveCredits] = useState<LeaveCredits | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<RecentLeave[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [employeeTrends, setEmployeeTrends] = useState<any>(null);

  const isAdminLevel = user?.role === "ADMIN" || user?.role === "HR_ADMIN";

  // Memoize fetchData to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      if (isAdminLevel) {
        const [summaryData, analyticsData] = await Promise.all([
          getDashboardSummary(),
          getAdminAnalytics(),
        ]);
        setSummary(summaryData);
        setAdminAnalytics(analyticsData);
      } else {
        const [analyticsData, todayData, creditsData, leavesData] =
          await Promise.all([
            getMyAnalytics(),
            getTodayStatus(),
            leaveService.getLeaveCredits(),
            leaveService.getMyLeaves(),
          ]);

        setSummary(analyticsData.summary);
        setEmployeeTrends(analyticsData.trends);
        setToday(todayData);
        setLeaveCredits(creditsData);
        setRecentLeaves(leavesData.slice(0, 3));
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isAdminLevel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize metrics calculation
  const metrics = useMemo(() => {
    if (!summary) return null;

    const total =
      (summary.present || 0) +
      (summary.late || 0) +
      (summary.absent || 0) +
      (summary.on_leave || 0);

    if (total === 0) {
      return {
        attendanceRate: "0",
        absenteeRate: "0",
        lateRate: "0",
        leaveRate: "0",
      };
    }

    return {
      attendanceRate: (((summary.present || 0) / total) * 100).toFixed(1),
      absenteeRate: (((summary.absent || 0) / total) * 100).toFixed(1),
      lateRate: (((summary.late || 0) / total) * 100).toFixed(1),
      leaveRate: (((summary.on_leave || 0) / total) * 100).toFixed(1),
    };
  }, [summary]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary dark:text-black" />
          </div>
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return isAdminLevel ? (
    <AdminDashboardContent
      summary={summary}
      adminAnalytics={adminAnalytics}
      metrics={metrics}
    />
  ) : (
    <EmployeeDashboardContent
      user={user}
      summary={summary}
      today={today}
      leaveCredits={leaveCredits}
      recentLeaves={recentLeaves}
      employeeTrends={employeeTrends}
      navigate={navigate}
    />
  );
};

export default React.memo(Dashboard);
