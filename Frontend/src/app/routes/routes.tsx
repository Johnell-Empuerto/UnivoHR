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
import DocsLayout from "@/features/docs/pages/DocsLayout";
import LoginDocs from "@/features/docs/pages/LoginDocs";
import DashboardDocs from "@/features/docs/pages/DashboardDocs";
import AttendanceDocs from "@/features/docs/pages/AttendanceDocs";
import LeavesDocs from "@/features/docs/pages/LeavesDocs";
import CalendarDocs from "@/features/docs/pages/CalendarDocs";
import PayrollAdminDocs from "@/features/docs/pages/PayrollAdminDocs";
import ProfileDocs from "@/features/docs/pages/ProfileDocs";
import ManHoursDocs from "@/features/docs/pages/ManHoursDocs";
import OvertimeDocs from "@/features/docs/pages/OvertimeDocs";
import SettingsDocs from "@/features/docs/pages/SettingsDocs";
import EmployeesDocs from "@/features/docs/pages/EmployeesDocs";
import UsersDocs from "@/features/docs/pages/UsersDocs";
import BranchesPage from "@/features/branches/pages/BranchesPage";
import AnomalyPage from "@/features/anomalies/pages/AnomalyPage";
import HRPolicies from "@/pages/HRPolicies";
import JobPositionsPage from "@/features/recruitment/pages/JobPositionsPage";
import ApplicantsPage from "@/features/recruitment/pages/ApplicantsPage";
import ApplicantDetailPage from "@/features/recruitment/pages/ApplicantDetailPage";
import ApplicantFormPage from "@/features/recruitment/pages/ApplicantFormPage";
import KpiTemplatesPage from "@/features/kpi/pages/KpiTemplatesPage";
import KpiEvaluationPage from "@/features/kpi/pages/KpiEvaluationPage";
import EmployeeEvaluationPage from "@/features/kpi/pages/EmployeeEvaluationPage";
import SelfEvaluationPage from "@/features/kpi/pages/SelfEvaluationPage";
import HrFormsPage from "@/features/hr-forms/pages/HrFormsPage";
import HrFormBuilderPage from "@/features/hr-forms/pages/HrFormBuilderPage";
import HrFormAssignmentsPage from "@/features/hr-forms/pages/HrFormAssignmentsPage";
import HrFormSubmissionsPage from "@/features/hr-forms/pages/HrFormSubmissionsPage";
import HrFormSubmissionViewPage from "@/features/hr-forms/pages/HrFormSubmissionViewPage";
import MyFormsPage from "@/features/hr-forms/pages/MyFormsPage";
import MyFormFillPage from "@/features/hr-forms/pages/MyFormFillPage";
import MyBenefitsPage from "@/features/benefits/pages/MyBenefitsPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";


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

        {/* legal & public docs */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/security" element={<SecurityPage />} />

        {/* docs */}
        <Route path="/docs" element={<DocsLayout />}>
          <Route path="login" element={<LoginDocs />} />
          <Route path="dashboard" element={<DashboardDocs />} />
          <Route path="attendance" element={<AttendanceDocs />} />
          <Route path="leaves" element={<LeavesDocs />} />
          <Route path="calendar" element={<CalendarDocs />} />
          <Route path="man-hours" element={<ManHoursDocs />} />
          <Route path="overtime" element={<OvertimeDocs />} />
          <Route path="payroll-admin" element={<PayrollAdminDocs />} />
          <Route path="employees" element={<EmployeesDocs />} />
          <Route path="users" element={<UsersDocs />} />
          <Route path="settings" element={<SettingsDocs />} />
          <Route path="profile" element={<ProfileDocs />} />
        </Route>

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
          <Route path="/my-benefits" element={<MyBenefitsPage />} />
          <Route path="/reports" element={
            user?.role === "ADMIN" || user?.role === "HR_ADMIN" || user?.role === "HR" ? (
              <ReportsPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />

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

          {/* HR Policies - Everyone can view, admin gets management controls */}
          <Route path="/hr-policies" element={<HRPolicies />} />

          {/* Branch Management - ADMIN and HR_ADMIN only */}
          {(user?.role === "ADMIN" || user?.role === "HR_ADMIN") && (
            <Route path="/branches" element={<BranchesPage />} />
          )}

          {/* Anomaly Detection - ADMIN, HR_ADMIN, HR */}
          <Route
            path="/anomalies"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" || user?.role === "HR" ? (
                <AnomalyPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* Recruitment Routes - HR roles only */}
          <Route
            path="/recruitment/job-positions"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" || user?.role === "HR" ? (
                <JobPositionsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/applicants"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" || user?.role === "HR" ? (
                <ApplicantsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/applicants/new"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" || user?.role === "HR" ? (
                <ApplicantFormPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/applicants/:id"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" || user?.role === "HR" ? (
                <ApplicantDetailPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* KPI / Performance Management */}
          <Route
            path="/kpi/templates"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" ? (
                <KpiTemplatesPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/kpi/evaluations"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" ? (
                <KpiEvaluationPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/kpi/my-evaluations"
            element={
              user?.employee_id ? (
                <EmployeeEvaluationPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/kpi/self-evaluation"
            element={
              user?.employee_id ? (
                <SelfEvaluationPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* HR Dynamic Forms */}
          <Route
            path="/hr-forms"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" ? (
                <HrFormsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/:id/builder"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" ? (
                <HrFormBuilderPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/assignments"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" ? (
                <HrFormAssignmentsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/submissions"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" ? (
                <HrFormSubmissionsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/submissions/:submissionId"
            element={
              user?.role === "ADMIN" || user?.role === "HR_ADMIN" ? (
                <HrFormSubmissionViewPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/my-forms"
            element={
              user?.employee_id ? (
                <MyFormsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/my-forms/:assignmentId"
            element={
              user?.employee_id ? (
                <MyFormFillPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
