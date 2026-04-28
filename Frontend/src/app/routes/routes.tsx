import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "@/features/auth/pages/Login";
import Dashboard from "@/features/dashboard/pages/Dashboard";
import AttendancePage from "@/features/attendance/pages/AttendancePage";
import { useAuth } from "@/app/providers/AuthProvider";
import EmployeeList from "@/features/employees/pages/EmployeeList";
import LeavePage from "@/features/leaves/pages/LeavePage";
import AdminLeavePage from "@/features/leaves/pages/AdminLeavePage";
import PayRollPage from "@/features/payroll/pages/PayRollPage";
import EmployeePayrollPage from "@/features/payroll/pages/EmployeePayrollPage";
import Setting from "@/features/settings/pages/Setting";
import CalendarPage from "@/features/calendar/pages/Calendar";
import AppLayout from "@/components/layout/AppLayout";
import PayrollDetails from "@/features/payroll/pages/PayrollDetails";
import MyOvertime from "@/features/overtime/pages/MyOvertime";
import OvertimeRequests from "@/features/overtime/pages/OvertimeRequests";
import { isApprover as checkIsApprover } from "@/services/overtimeService";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";
import MyManHoursReport from "@/features/man-hour-reports/pages/MyManHoursReport";
import ManHoursApproval from "@/features/man-hour-reports/pages/ManHoursApproval";
import Users from "@/features/users/pages/Users";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import PrivacyPage from "@/features/legal/pages/PrivacyPage";
import TermsPage from "@/features/legal/pages/TermsPage";
import SecurityPage from "@/features/legal/pages/SecurityPage";
import AdminLeaveCreditsPage from "@/features/leaves/pages/AdminLeaveCreditsPage";

const AppRoutes = () => {
  const { isAuth, user } = useAuth();
  const [canAccessOvertime, setCanAccessOvertime] = useState(false);
  const [canAccessManHours, setCanAccessManHours] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuth || !user) {
        setLoading(false);
        return;
      }

      // Check Overtime Access
      if (
        user?.role === "ADMIN" ||
        user?.role === "HR_ADMIN" ||
        user?.role === "HR"
      ) {
        setCanAccessOvertime(true);
        setCanAccessManHours(true);
      } else if (user?.id) {
        try {
          const result = await checkIsApprover();
          setCanAccessOvertime(result.isApprover);
          setCanAccessManHours(result.isApprover);
        } catch (error) {
          setCanAccessOvertime(false);
          setCanAccessManHours(false);
        }
      } else {
        setCanAccessOvertime(false);
        setCanAccessManHours(false);
      }

      setLoading(false);
    };

    checkAccess();
  }, [isAuth, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/"
          element={
            isAuth ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/login"
          element={isAuth ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* legal */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/security" element={<SecurityPage />} />

        {/* PROTECTED - WITH LAYOUT */}
        <Route
          element={isAuth ? <AppLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/employees" element={<EmployeeList />} />
          <Route
            path="/payroll"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" ? (
                <PayRollPage />
              ) : (
                <EmployeePayrollPage />
              )
            }
          />
          <Route
            path="/leaves"
            element={
              user?.role === "ADMIN" ? <AdminLeavePage /> : <LeavePage />
            }
          />

          {/* LEAVE CREDITS MANAGEMENT - Redirect to /leaves */}
          <Route
            path="/leave-credits"
            element={<Navigate to="/leaves" replace />}
          />

          <Route path="/payroll/details/:id" element={<PayrollDetails />} />

          <Route path="/calendar" element={<CalendarPage />} />

          <Route path="/settings" element={<Setting />} />
          <Route path="/myovertime" element={<MyOvertime />} />

          <Route path="/users" element={<Users />} />

          <Route path="/profile" element={<ProfilePage />} />

          {/* Allow approvers (even EMPLOYEE role) to access Manage Overtime */}
          <Route
            path="/overtime"
            element={
              canAccessOvertime ? (
                <OvertimeRequests />
              ) : (
                <Navigate to="/myovertime" />
              )
            }
          />

          {/* MAN HOUR REPORTS ROUTES */}
          <Route path="/my-manhours" element={<MyManHoursReport />} />

          <Route
            path="/manhours-approval"
            element={
              canAccessManHours ? (
                <ManHoursApproval />
              ) : (
                <Navigate to="/my-manhours" />
              )
            }
          />

          {/* Notifications page - Inside layout with sidebar and navbar */}
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
