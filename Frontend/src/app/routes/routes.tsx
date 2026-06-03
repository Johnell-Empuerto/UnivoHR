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
import MyPerformancePage from "@/features/performance/pages/MyPerformancePage";
import MyKpiResultsPage from "@/features/performance/pages/MyKpiResultsPage";
import MyProbationStatusPage from "@/features/performance/pages/MyProbationStatusPage";
import HrFormsPage from "@/features/hr-forms/pages/HrFormsPage";
import HrFormBuilderPage from "@/features/hr-forms/pages/HrFormBuilderPage";
import HrFormAssignmentsPage from "@/features/hr-forms/pages/HrFormAssignmentsPage";
import HrFormSubmissionsPage from "@/features/hr-forms/pages/HrFormSubmissionsPage";
import HrFormSubmissionViewPage from "@/features/hr-forms/pages/HrFormSubmissionViewPage";
import MyFormsPage from "@/features/hr-forms/pages/MyFormsPage";
import MyFormFillPage from "@/features/hr-forms/pages/MyFormFillPage";
import MyBenefitsPage from "@/features/benefits/pages/MyBenefitsPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";
import UserPermissionsPage from "@/features/permissions/pages/UserPermissionsPage";



const AppRoutes = () => {
  const { isAuth, user, hasPermission } = useAuth();
  const [canAccessOvertime, setCanAccessOvertime] = useState(false);
  const [canAccessManHours, setCanAccessManHours] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuth || !user) {
        setLoading(false);
        return;
      }

      if (user?.id) {
        try {
          const result = await checkIsApprover();
          const isAdminOrApprover = user?.role === "ADMIN" || result.isApprover;
          setCanAccessOvertime(isAdminOrApprover);
          setCanAccessManHours(isAdminOrApprover);
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
          <Route
            path="/employees"
            element={
              hasPermission("employees.view") ? (
                <EmployeeList />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/payroll"
            element={
              hasPermission("payroll.view") ? (
                hasPermission("payroll.generate") ? (
                  <PayRollPage />
                ) : (
                  <EmployeePayrollPage />
                )
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/leaves"
            element={
              hasPermission("leave.manage") || hasPermission("leave.approve") ? (
                <AdminLeavePage />
              ) : (
                <LeavePage />
              )
            }
          />

          {/* LEAVE CREDITS MANAGEMENT - Redirect to /leaves */}
          <Route
            path="/leave-credits"
            element={<Navigate to="/leaves" replace />}
          />

          <Route path="/payroll/details/:id" element={<PayrollDetails />} />
          <Route path="/my-benefits" element={<MyBenefitsPage />} />
          <Route
            path="/reports"
            element={
              hasPermission("reports.view") ? (
                <ReportsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route path="/calendar" element={<CalendarPage />} />

          <Route
            path="/settings"
            element={
              hasPermission("settings.view") ? (
                <Setting />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route path="/myovertime" element={<MyOvertime />} />

          <Route
            path="/users"
            element={
              hasPermission("users.view") ? (
                <Users />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

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

          {/* Branch Management */}
          {hasPermission("branches.view") && (
            <Route path="/branches" element={<BranchesPage />} />
          )}

          {/* Anomaly Detection */}
          <Route
            path="/anomalies"
            element={
              hasPermission("anomalies.view") ? (
                <AnomalyPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* Recruitment Routes */}
          <Route
            path="/recruitment/job-positions"
            element={
              hasPermission("recruitment.view") ? (
                <JobPositionsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/applicants"
            element={
              hasPermission("recruitment.view") ? (
                <ApplicantsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/applicants/new"
            element={
              hasPermission("recruitment.view") ? (
                <ApplicantFormPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/applicants/:id"
            element={
              hasPermission("recruitment.view") ? (
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
              hasPermission("performance.templates.manage") ? (
                <KpiTemplatesPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/kpi/evaluations"
            element={
              hasPermission("performance.evaluations.manage") ? (
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

          {/* Employee Performance Portal */}
          <Route
            path="/my-performance"
            element={
              (hasPermission("my_performance.view") || hasPermission("performance.view")) && user?.employee_id ? (
                <MyPerformancePage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/my-performance/kpi-results"
            element={
              (hasPermission("my_performance.view") || hasPermission("performance.view")) && user?.employee_id ? (
                <MyKpiResultsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/my-performance/probation"
            element={
              (hasPermission("my_performance.view") || hasPermission("performance.view")) && user?.employee_id ? (
                <MyProbationStatusPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* HR Dynamic Forms */}
          <Route
            path="/hr-forms"
            element={
              hasPermission("forms.builder.manage") ? (
                <HrFormsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/:id/builder"
            element={
              hasPermission("forms.builder.manage") ? (
                <HrFormBuilderPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/assignments"
            element={
              hasPermission("forms.assignments.manage") ? (
                <HrFormAssignmentsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/submissions"
            element={
              hasPermission("forms.submissions.view") ? (
                <HrFormSubmissionsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/submissions/:submissionId"
            element={
              hasPermission("forms.submissions.view") ? (
                <HrFormSubmissionViewPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/my-forms"
            element={
              user?.employee_id && (hasPermission("my_performance.view") || hasPermission("forms.view_own")) ? (
                <MyFormsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/my-forms/:assignmentId"
            element={
              user?.employee_id && (hasPermission("my_performance.view") || hasPermission("forms.view_own")) ? (
                <MyFormFillPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* User Permissions Management */}
          {hasPermission("users.manage") && (
            <Route path="/user-permissions" element={<UserPermissionsPage />} />
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
