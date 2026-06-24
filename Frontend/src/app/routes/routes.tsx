import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useState, useEffect } from "react";
const Login = lazy(() => import("@/features/auth/pages/Login"));
const Dashboard = lazy(() => import("@/features/dashboard/pages/Dashboard"));
const AttendancePage = lazy(() => import("@/features/attendance/pages/AttendancePage"));
import { useAuth } from "@/app/providers/AuthProvider";
const EmployeeList = lazy(() => import("@/features/employees/pages/EmployeeList"));
const LeavePage = lazy(() => import("@/features/leaves/pages/LeavePage"));
const AdminLeavePage = lazy(() => import("@/features/leaves/pages/AdminLeavePage"));
const PayRollPage = lazy(() => import("@/features/payroll/pages/PayRollPage"));
const EmployeePayrollPage = lazy(() => import("@/features/payroll/pages/EmployeePayrollPage"));
const Setting = lazy(() => import("@/features/settings/pages/Setting"));
const CalendarPage = lazy(() => import("@/features/calendar/pages/Calendar"));
import AppLayout from "@/components/layout/AppLayout";
const PayrollDetails = lazy(() => import("@/features/payroll/pages/PayrollDetails"));
const MyOvertime = lazy(() => import("@/features/overtime/pages/MyOvertime"));
const OvertimeRequests = lazy(() => import("@/features/overtime/pages/OvertimeRequests"));
import { isApprover as checkIsApprover } from "@/services/overtimeService";
import Loader from "@/components/shared/Loader";

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<Loader fullPage />}>{element}</Suspense>
);

const NotificationsPage = lazy(() => import("@/features/notifications/pages/NotificationsPage"));
const MyManHoursReport = lazy(() => import("@/features/man-hour-reports/pages/MyManHoursReport"));
const ManHoursApproval = lazy(() => import("@/features/man-hour-reports/pages/ManHoursApproval"));
const Users = lazy(() => import("@/features/users/pages/Users"));
const ProfilePage = lazy(() => import("@/features/profile/pages/ProfilePage"));
const PrivacyPage = lazy(() => import("@/features/legal/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/features/legal/pages/TermsPage"));
const SecurityPage = lazy(() => import("@/features/legal/pages/SecurityPage"));
const DocsLayout = lazy(() => import("@/features/docs/pages/DocsLayout"));
const DocsOverview = lazy(() => import("@/features/docs/pages/DocsOverview"));
const FirstAdminLoginDocs = lazy(() => import("@/features/docs/pages/FirstAdminLoginDocs"));
const ChangeAdminPasswordDocs = lazy(() => import("@/features/docs/pages/ChangeAdminPasswordDocs"));
const CompanyBrandingDocs = lazy(() => import("@/features/docs/pages/CompanyBrandingDocs"));
const BranchSetupDocs = lazy(() => import("@/features/docs/pages/BranchSetupDocs"));
const EmployeeCodeSettingsDocs = lazy(() => import("@/features/docs/pages/EmployeeCodeSettingsDocs"));
const TimezoneSettingsDocs = lazy(() => import("@/features/docs/pages/TimezoneSettingsDocs"));
const AttendanceSettingsDocs = lazy(() => import("@/features/docs/pages/AttendanceSettingsDocs"));
const ShiftSettingsDocs = lazy(() => import("@/features/docs/pages/ShiftSettingsDocs"));
const RestDaySettingsDocs = lazy(() => import("@/features/docs/pages/RestDaySettingsDocs"));
const CalendarHolidaySetupDocs = lazy(() => import("@/features/docs/pages/CalendarHolidaySetupDocs"));
const PayRulesDocs = lazy(() => import("@/features/docs/pages/PayRulesDocs"));
const PayrollRulesDocs = lazy(() => import("@/features/docs/pages/PayrollRulesDocs"));
const ApprovalSettingsDocs = lazy(() => import("@/features/docs/pages/ApprovalSettingsDocs"));
const SMTPSettingsDocs = lazy(() => import("@/features/docs/pages/SMTPSettingsDocs"));
const EmailTemplatesDocs = lazy(() => import("@/features/docs/pages/EmailTemplatesDocs"));
const NotificationSettingsDocs = lazy(() => import("@/features/docs/pages/NotificationSettingsDocs"));
const DeviceSetupDocs = lazy(() => import("@/features/docs/pages/DeviceSetupDocs"));
const DeviceUserMappingDocs = lazy(() => import("@/features/docs/pages/DeviceUserMappingDocs"));
const DeviceLogMappingDocs = lazy(() => import("@/features/docs/pages/DeviceLogMappingDocs"));
const EmployeeSalarySetupDocs = lazy(() => import("@/features/docs/pages/EmployeeSalarySetupDocs"));
const EmployeeShiftAssignmentDocs = lazy(() => import("@/features/docs/pages/EmployeeShiftAssignmentDocs"));
const UserPermissionsDocs = lazy(() => import("@/features/docs/pages/UserPermissionsDocs"));
const BranchAccessDocs = lazy(() => import("@/features/docs/pages/BranchAccessDocs"));
const HRPoliciesDocs = lazy(() => import("@/features/docs/pages/HRPoliciesDocs"));
const AnomaliesDocs = lazy(() => import("@/features/docs/pages/AnomaliesDocs"));
const LoginDocs = lazy(() => import("@/features/docs/pages/LoginDocs"));
const DashboardDocs = lazy(() => import("@/features/docs/pages/DashboardDocs"));
const AttendanceDocs = lazy(() => import("@/features/docs/pages/AttendanceDocs"));
const LeavesDocs = lazy(() => import("@/features/docs/pages/LeavesDocs"));
const CalendarDocs = lazy(() => import("@/features/docs/pages/CalendarDocs"));
const PayrollAdminDocs = lazy(() => import("@/features/docs/pages/PayrollAdminDocs"));
const ProfileDocs = lazy(() => import("@/features/docs/pages/ProfileDocs"));
const ManHoursDocs = lazy(() => import("@/features/docs/pages/ManHoursDocs"));
const OvertimeDocs = lazy(() => import("@/features/docs/pages/OvertimeDocs"));
const SettingsDocs = lazy(() => import("@/features/docs/pages/SettingsDocs"));
const EmployeesDocs = lazy(() => import("@/features/docs/pages/EmployeesDocs"));
const EmployeeBulkUploadDocs = lazy(() => import("@/features/docs/pages/EmployeeBulkUploadDocs"));
const UsersDocs = lazy(() => import("@/features/docs/pages/UsersDocs"));
const JobPositionsDocs = lazy(() => import("@/features/docs/pages/JobPositionsDocs"));
const RecruitmentWorkflowDocs = lazy(() => import("@/features/docs/pages/RecruitmentWorkflowDocs"));
const ApplicantsDocs = lazy(() => import("@/features/docs/pages/ApplicantsDocs"));
const MyRecruitmentAssignmentsDocs = lazy(() => import("@/features/docs/pages/MyRecruitmentAssignmentsDocs"));
const KpiTemplatesDocs = lazy(() => import("@/features/docs/pages/KpiTemplatesDocs"));
const KpiEvaluationsDocs = lazy(() => import("@/features/docs/pages/KpiEvaluationsDocs"));
const EmployeeKpiResultsDocs = lazy(() => import("@/features/docs/pages/EmployeeKpiResultsDocs"));
const FormTemplatesDocs = lazy(() => import("@/features/docs/pages/FormTemplatesDocs"));
const AssignFormsDocs = lazy(() => import("@/features/docs/pages/AssignFormsDocs"));
const FormSubmissionsDocs = lazy(() => import("@/features/docs/pages/FormSubmissionsDocs"));
const PayrollDetailsDocs = lazy(() => import("@/features/docs/pages/PayrollDetailsDocs"));
const PayslipDownloadDocs = lazy(() => import("@/features/docs/pages/PayslipDownloadDocs"));
const PayrollStatusActionsDocs = lazy(() => import("@/features/docs/pages/PayrollStatusActionsDocs"));
const ReportsDocs = lazy(() => import("@/features/docs/pages/ReportsDocs"));
const MyAttendanceClockDocs = lazy(() => import("@/features/docs/pages/MyAttendanceClockDocs"));
const MyLeavesDocs = lazy(() => import("@/features/docs/pages/MyLeavesDocs"));
const MyOvertimeDocs = lazy(() => import("@/features/docs/pages/MyOvertimeDocs"));
const MyManHoursDocs = lazy(() => import("@/features/docs/pages/MyManHoursDocs"));
const MyKpiResultsDocs = lazy(() => import("@/features/docs/pages/MyKpiResultsDocs"));
const MyFormsDocs = lazy(() => import("@/features/docs/pages/MyFormsDocs"));
const MyPayrollPayslipsDocs = lazy(() => import("@/features/docs/pages/MyPayrollPayslipsDocs"));
const MyBenefitsDocs = lazy(() => import("@/features/docs/pages/MyBenefitsDocs"));
const NotificationsGuideDocs = lazy(() => import("@/features/docs/pages/NotificationsGuideDocs"));
const AuthenticationLoginIssuesDocs = lazy(() => import("@/features/docs/pages/AuthenticationLoginIssuesDocs"));
const SecurityPermissionsDocs = lazy(() => import("@/features/docs/pages/SecurityPermissionsDocs"));
const AuditLogsDocs = lazy(() => import("@/features/docs/pages/AuditLogsDocs"));
const TroubleshootingDocs = lazy(() => import("@/features/docs/pages/TroubleshootingDocs"));
const DeploymentDocs = lazy(() => import("@/features/docs/pages/DeploymentDocs"));
const BackupRestoreDocs = lazy(() => import("@/features/docs/pages/BackupRestoreDocs"));
const MigrationDocs = lazy(() => import("@/features/docs/pages/MigrationDocs"));
const ProductionChecklistDocs = lazy(() => import("@/features/docs/pages/ProductionChecklistDocs"));
const BranchesPage = lazy(() => import("@/features/branches/pages/BranchesPage"));
const AnomalyPage = lazy(() => import("@/features/anomalies/pages/AnomalyPage"));
const HRPolicies = lazy(() => import("@/pages/HRPolicies"));
const JobPositionsPage = lazy(() => import("@/features/recruitment/pages/JobPositionsPage"));
const ApplicantsPage = lazy(() => import("@/features/recruitment/pages/ApplicantsPage"));
const ApplicantDetailPage = lazy(() => import("@/features/recruitment/pages/ApplicantDetailPage"));
const ApplicantFormPage = lazy(() => import("@/features/recruitment/pages/ApplicantFormPage"));
const MyInterviewAssignmentsPage = lazy(() => import("@/features/recruitment/pages/MyInterviewAssignmentsPage"));
const RecruitmentWorkflowsPage = lazy(() => import("@/features/recruitment/pages/RecruitmentWorkflowsPage"));
const KpiTemplatesPage = lazy(() => import("@/features/kpi/pages/KpiTemplatesPage"));
const KpiEvaluationPage = lazy(() => import("@/features/kpi/pages/KpiEvaluationPage"));
const EmployeeEvaluationPage = lazy(() => import("@/features/kpi/pages/EmployeeEvaluationPage"));
const SelfEvaluationPage = lazy(() => import("@/features/kpi/pages/SelfEvaluationPage"));
const MyPerformancePage = lazy(() => import("@/features/performance/pages/MyPerformancePage"));
const MyKpiResultsPage = lazy(() => import("@/features/performance/pages/MyKpiResultsPage"));
const MyProbationStatusPage = lazy(() => import("@/features/performance/pages/MyProbationStatusPage"));
const HrFormsPage = lazy(() => import("@/features/hr-forms/pages/HrFormsPage"));
const HrFormBuilderPage = lazy(() => import("@/features/hr-forms/pages/HrFormBuilderPage"));
const HrFormAssignmentsPage = lazy(() => import("@/features/hr-forms/pages/HrFormAssignmentsPage"));
const HrFormSubmissionsPage = lazy(() => import("@/features/hr-forms/pages/HrFormSubmissionsPage"));
const HrFormSubmissionViewPage = lazy(() => import("@/features/hr-forms/pages/HrFormSubmissionViewPage"));
const MyFormsPage = lazy(() => import("@/features/hr-forms/pages/MyFormsPage"));
const MyFormFillPage = lazy(() => import("@/features/hr-forms/pages/MyFormFillPage"));
const MyBenefitsPage = lazy(() => import("@/features/benefits/pages/MyBenefitsPage"));
const ReportsPage = lazy(() => import("@/features/reports/pages/ReportsPage"));
const UserPermissionsPage = lazy(() => import("@/features/permissions/pages/UserPermissionsPage"));



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
          element={isAuth ? <Navigate to="/dashboard" replace /> : withSuspense(<Login />)}
        />

        {/* legal & public docs */}
        <Route path="/privacy" element={withSuspense(<PrivacyPage />)} />
        <Route path="/terms" element={withSuspense(<TermsPage />)} />
        <Route path="/security" element={withSuspense(<SecurityPage />)} />

        {/* docs */}
        <Route
          path="/docs"
          element={
            hasPermission("docs.view") ? (
              withSuspense(<DocsLayout />)
            ) : (
              <Navigate to={isAuth ? "/dashboard" : "/login"} replace />
            )
          }
        >
          <Route index element={withSuspense(<DocsOverview />)} />
          <Route path="overview" element={withSuspense(<DocsOverview />)} />
          <Route path="first-admin-login" element={withSuspense(<FirstAdminLoginDocs />)} />
          <Route path="change-admin-password" element={withSuspense(<ChangeAdminPasswordDocs />)} />
          <Route path="company-branding" element={withSuspense(<CompanyBrandingDocs />)} />
          <Route path="branch-setup" element={withSuspense(<BranchSetupDocs />)} />
          <Route path="employee-code-settings" element={withSuspense(<EmployeeCodeSettingsDocs />)} />
          <Route path="timezone-settings" element={withSuspense(<TimezoneSettingsDocs />)} />
          <Route path="attendance-settings" element={withSuspense(<AttendanceSettingsDocs />)} />
          <Route path="shift-settings" element={withSuspense(<ShiftSettingsDocs />)} />
          <Route path="rest-day-settings" element={withSuspense(<RestDaySettingsDocs />)} />
          <Route path="calendar-holiday-setup" element={withSuspense(<CalendarHolidaySetupDocs />)} />
          <Route path="pay-rules" element={withSuspense(<PayRulesDocs />)} />
          <Route path="payroll-rules" element={withSuspense(<PayrollRulesDocs />)} />
          <Route path="approval-settings" element={withSuspense(<ApprovalSettingsDocs />)} />
          <Route path="smtp-settings" element={withSuspense(<SMTPSettingsDocs />)} />
          <Route path="email-templates" element={withSuspense(<EmailTemplatesDocs />)} />
          <Route path="notification-settings" element={withSuspense(<NotificationSettingsDocs />)} />
          <Route path="device-setup" element={withSuspense(<DeviceSetupDocs />)} />
          <Route path="device-user-mapping" element={withSuspense(<DeviceUserMappingDocs />)} />
          <Route path="device-log-mapping" element={withSuspense(<DeviceLogMappingDocs />)} />
          <Route path="employee-salary-setup" element={withSuspense(<EmployeeSalarySetupDocs />)} />
          <Route path="employee-shift-assignment" element={withSuspense(<EmployeeShiftAssignmentDocs />)} />
          <Route path="user-permissions" element={withSuspense(<UserPermissionsDocs />)} />
          <Route path="branch-access" element={withSuspense(<BranchAccessDocs />)} />
          <Route path="hr-policies" element={withSuspense(<HRPoliciesDocs />)} />
          <Route path="anomalies" element={withSuspense(<AnomaliesDocs />)} />
          <Route path="login" element={withSuspense(<LoginDocs />)} />
          <Route path="dashboard" element={withSuspense(<DashboardDocs />)} />
          <Route path="attendance" element={withSuspense(<AttendanceDocs />)} />
          <Route path="leaves" element={withSuspense(<LeavesDocs />)} />
          <Route path="calendar" element={withSuspense(<CalendarDocs />)} />
          <Route path="man-hours" element={withSuspense(<ManHoursDocs />)} />
          <Route path="overtime" element={withSuspense(<OvertimeDocs />)} />
          <Route path="payroll-admin" element={withSuspense(<PayrollAdminDocs />)} />
          <Route path="employees" element={withSuspense(<EmployeesDocs />)} />
          <Route path="employee-bulk-upload" element={withSuspense(<EmployeeBulkUploadDocs />)} />
          <Route path="users" element={withSuspense(<UsersDocs />)} />
          <Route path="settings" element={withSuspense(<SettingsDocs />)} />
          <Route path="profile" element={withSuspense(<ProfileDocs />)} />
          <Route path="job-positions" element={withSuspense(<JobPositionsDocs />)} />
          <Route path="recruitment-workflow" element={withSuspense(<RecruitmentWorkflowDocs />)} />
          <Route path="applicants" element={withSuspense(<ApplicantsDocs />)} />
          <Route path="my-recruitment-assignments" element={withSuspense(<MyRecruitmentAssignmentsDocs />)} />
          <Route path="kpi-templates" element={withSuspense(<KpiTemplatesDocs />)} />
          <Route path="kpi-evaluations" element={withSuspense(<KpiEvaluationsDocs />)} />
          <Route path="employee-kpi-results" element={withSuspense(<EmployeeKpiResultsDocs />)} />
          <Route path="form-templates" element={withSuspense(<FormTemplatesDocs />)} />
          <Route path="assign-forms" element={withSuspense(<AssignFormsDocs />)} />
          <Route path="form-submissions" element={withSuspense(<FormSubmissionsDocs />)} />
          <Route path="payroll-details" element={withSuspense(<PayrollDetailsDocs />)} />
          <Route path="payslip-download" element={withSuspense(<PayslipDownloadDocs />)} />
          <Route path="payroll-status-actions" element={withSuspense(<PayrollStatusActionsDocs />)} />
          <Route path="reports" element={withSuspense(<ReportsDocs />)} />
          <Route path="my-attendance-clock" element={withSuspense(<MyAttendanceClockDocs />)} />
          <Route path="my-leaves" element={withSuspense(<MyLeavesDocs />)} />
          <Route path="my-overtime" element={withSuspense(<MyOvertimeDocs />)} />
          <Route path="my-man-hours" element={withSuspense(<MyManHoursDocs />)} />
          <Route path="my-kpi-results" element={withSuspense(<MyKpiResultsDocs />)} />
          <Route path="my-forms" element={withSuspense(<MyFormsDocs />)} />
          <Route path="my-payroll-payslips" element={withSuspense(<MyPayrollPayslipsDocs />)} />
          <Route path="my-benefits" element={withSuspense(<MyBenefitsDocs />)} />
          <Route path="notifications-guide" element={withSuspense(<NotificationsGuideDocs />)} />
          {/* Phase 9 — Security, Audit & Troubleshooting */}
          <Route path="authentication-login-issues" element={withSuspense(<AuthenticationLoginIssuesDocs />)} />
          <Route path="security-permissions" element={withSuspense(<SecurityPermissionsDocs />)} />
          <Route path="audit-logs" element={withSuspense(<AuditLogsDocs />)} />
          <Route path="troubleshooting" element={withSuspense(<TroubleshootingDocs />)} />
          {/* Phase 10 — Deployment */}
          <Route path="deployment" element={withSuspense(<DeploymentDocs />)} />
          <Route path="backup-restore" element={withSuspense(<BackupRestoreDocs />)} />
          <Route path="migration" element={withSuspense(<MigrationDocs />)} />
          <Route path="production-checklist" element={withSuspense(<ProductionChecklistDocs />)} />
        </Route>

        {/* PROTECTED - WITH LAYOUT */}
        <Route
          element={isAuth ? <AppLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="/dashboard" element={withSuspense(<Dashboard />)} />
          <Route path="/attendance" element={withSuspense(<AttendancePage />)} />
          <Route
            path="/employees"
            element={
              hasPermission("employees.view") ? (
                withSuspense(<EmployeeList />)
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
                  withSuspense(<PayRollPage />)
                ) : (
                  withSuspense(<EmployeePayrollPage />)
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
                withSuspense(<AdminLeavePage />)
              ) : (
                withSuspense(<LeavePage />)
              )
            }
          />

          {/* LEAVE CREDITS MANAGEMENT - Redirect to /leaves */}
          <Route
            path="/leave-credits"
            element={<Navigate to="/leaves" replace />}
          />

          <Route path="/payroll/details/:id" element={withSuspense(<PayrollDetails />)} />
          <Route path="/my-benefits" element={withSuspense(<MyBenefitsPage />)} />
          <Route
            path="/reports"
            element={
              hasPermission("reports.view") ? (
                withSuspense(<ReportsPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route path="/calendar" element={withSuspense(<CalendarPage />)} />

          <Route
            path="/settings"
            element={
              hasPermission("settings.view") ? (
                withSuspense(<Setting />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route path="/myovertime" element={withSuspense(<MyOvertime />)} />

          <Route
            path="/users"
            element={
              hasPermission("users.view") ? (
                withSuspense(<Users />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route path="/profile" element={withSuspense(<ProfilePage />)} />

          {/* Allow approvers (even EMPLOYEE role) to access Manage Overtime */}
          <Route
            path="/overtime"
            element={
              canAccessOvertime ? (
                withSuspense(<OvertimeRequests />)
              ) : (
                <Navigate to="/myovertime" />
              )
            }
          />

          {/* MAN HOUR REPORTS ROUTES */}
          <Route path="/my-manhours" element={withSuspense(<MyManHoursReport />)} />

          <Route
            path="/manhours-approval"
            element={
              canAccessManHours ? (
                withSuspense(<ManHoursApproval />)
              ) : (
                <Navigate to="/my-manhours" />
              )
            }
          />

          {/* Notifications page - Inside layout with sidebar and navbar */}
          <Route path="/notifications" element={withSuspense(<NotificationsPage />)} />

          {/* HR Policies - Everyone can view, admin gets management controls */}
          <Route path="/hr-policies" element={withSuspense(<HRPolicies />)} />

          {/* Branch Management */}
          {hasPermission("branches.view") && (
            <Route path="/branches" element={withSuspense(<BranchesPage />)} />
          )}

          {/* Anomaly Detection */}
          <Route
            path="/anomalies"
            element={
              hasPermission("anomalies.view") ? (
                withSuspense(<AnomalyPage />)
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
                withSuspense(<JobPositionsPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/applicants"
            element={
              hasPermission("recruitment.view") ? (
                withSuspense(<ApplicantsPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/applicants/new"
            element={
              hasPermission("recruitment.view") ? (
                withSuspense(<ApplicantFormPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/applicants/:id"
            element={
              hasPermission("recruitment.view") ? (
                withSuspense(<ApplicantDetailPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/my-interviews"
            element={
              hasPermission("recruitment.view") ? (
                withSuspense(<MyInterviewAssignmentsPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/my-assignments"
            element={
              hasPermission("recruitment.view") ? (
                withSuspense(<MyInterviewAssignmentsPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/recruitment/workflows"
            element={
              hasPermission("recruitment.workflows.manage") ? (
                withSuspense(<RecruitmentWorkflowsPage />)
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
                withSuspense(<KpiTemplatesPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/kpi/evaluations"
            element={
              hasPermission("performance.evaluations.manage") ? (
                withSuspense(<KpiEvaluationPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/kpi/my-evaluations"
            element={
              user?.employee_id ? (
                withSuspense(<EmployeeEvaluationPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/kpi/self-evaluation"
            element={
              user?.employee_id ? (
                withSuspense(<SelfEvaluationPage />)
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
                withSuspense(<MyPerformancePage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/my-performance/kpi-results"
            element={
              (hasPermission("my_performance.view") || hasPermission("performance.view")) && user?.employee_id ? (
                withSuspense(<MyKpiResultsPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/my-performance/probation"
            element={
              (hasPermission("my_performance.view") || hasPermission("performance.view")) && user?.employee_id ? (
                withSuspense(<MyProbationStatusPage />)
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
                withSuspense(<HrFormsPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/:id/builder"
            element={
              hasPermission("forms.builder.manage") ? (
                withSuspense(<HrFormBuilderPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/assignments"
            element={
              hasPermission("forms.assignments.manage") ? (
                withSuspense(<HrFormAssignmentsPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/submissions"
            element={
              hasPermission("forms.submissions.view") ? (
                withSuspense(<HrFormSubmissionsPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/hr-forms/submissions/:submissionId"
            element={
              hasPermission("forms.submissions.view") ? (
                withSuspense(<HrFormSubmissionViewPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/my-forms"
            element={
              user?.employee_id && (hasPermission("my_performance.view") || hasPermission("forms.view_own")) ? (
                withSuspense(<MyFormsPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/my-forms/:assignmentId"
            element={
              user?.employee_id && (hasPermission("my_performance.view") || hasPermission("forms.view_own")) ? (
                withSuspense(<MyFormFillPage />)
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* User Permissions Management */}
          {hasPermission("users.manage") && (
            <Route path="/user-permissions" element={withSuspense(<UserPermissionsPage />)} />
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
