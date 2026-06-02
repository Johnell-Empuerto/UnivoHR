"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import AttendanceSettings from "../components/AttendanceSettings";
import PayRulesSettings from "../components/PayRulesSettings";
import SMTPSettings from "../components/SMTPSettings";
import ApprovalSettings from "../components/ApprovalSettings";
import NotificationSettings from "../components/NotificationSettings";
import EmailTemplateEditor from "../components/EmailTemplateEditor";
import CompanyBranding from "../components/CompanyBranding";
import EmployeeCodeSettings from "../components/EmployeeCodeSettings";
import ShiftManagement from "../components/ShiftManagement";
import BranchRestDays from "../components/BranchRestDays";
import PayrollRulesSettings from "../components/PayrollRulesSettings";
import RotationGroups from "../components/RotationGroups";
import RotationPatterns from "../components/RotationPatterns";
import RotationAssignments from "../components/RotationAssignments";
import EmployeeRotation from "../components/EmployeeRotation";

const Setting = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("attendance");

  const canViewAttendance = hasPermission("settings.attendance_rules");
  const canViewPayRules = hasPermission("payroll.settings");
  const canViewApprovals = hasPermission("settings.approvals");
  const canViewSMTP = hasPermission("settings.smtp");
  const canViewNotifications = hasPermission("settings.notifications");
  const canViewEmailTemplates = hasPermission("settings.email_templates");
  const canViewBranding = hasPermission("settings.branding");
  const canViewEmployeeCodes = hasPermission("settings.branding");
  const canViewShifts = hasPermission("settings.attendance_rules");
  const canViewBranchRestDays = hasPermission("settings.branding");
  const canViewPayrollRules = hasPermission("payroll.settings");
  const canViewRotation = hasPermission("settings.attendance_rules");

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            System Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure attendance rules, pay rates, approvals, email, and
            notifications
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="gap-0"
      >
        <TabsList
          className="flex flex-wrap !w-full gap-2 bg-transparent !p-0 !h-auto rounded-none shadow-none border-none"
          style={{ height: "auto !important" }}
        >
          {canViewAttendance && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="attendance"
            >
              Attendance
            </TabsTrigger>
          )}
          {canViewPayRules && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="payrules"
            >
              Pay Rules
            </TabsTrigger>
          )}
          {canViewApprovals && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="approvals"
            >
              Approvals
            </TabsTrigger>
          )}
          {canViewSMTP && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="smtp"
            >
              SMTP
            </TabsTrigger>
          )}
          {canViewNotifications && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="notifications"
            >
              Notifications
            </TabsTrigger>
          )}
          {canViewEmailTemplates && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="email-templates"
            >
              Email Templates
            </TabsTrigger>
          )}
          {canViewBranding && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="branding"
            >
              Branding
            </TabsTrigger>
          )}
          {canViewEmployeeCodes && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="employee-codes"
            >
              Employee Codes
            </TabsTrigger>
          )}
          {canViewShifts && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="shifts"
            >
              Shifts
            </TabsTrigger>
          )}
          {canViewBranchRestDays && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="branch-rest-days"
            >
              Rest Days
            </TabsTrigger>
          )}
          {canViewPayrollRules && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="payroll-rules"
            >
              Payroll Rules
            </TabsTrigger>
          )}
          {canViewRotation && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="rotation-groups"
            >
              Rotation Groups
            </TabsTrigger>
          )}
          {canViewRotation && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="rotation-patterns"
            >
              Rotation Patterns
            </TabsTrigger>
          )}
          {canViewRotation && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="rotation-assignments"
            >
              Pattern Assignments
            </TabsTrigger>
          )}
          {canViewRotation && (
            <TabsTrigger
              className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
              style={{ height: "auto", flex: "none" }}
              value="employee-rotation"
            >
              Employee Rotation
            </TabsTrigger>
          )}
        </TabsList>

        <div style={{ marginTop: "24px" }}>
          {canViewAttendance && (
            <TabsContent value="attendance" className="mt-0">
              <AttendanceSettings />
            </TabsContent>
          )}

          {canViewPayRules && (
            <TabsContent value="payrules" className="mt-0">
              <PayRulesSettings />
            </TabsContent>
          )}

          {canViewApprovals && (
            <TabsContent value="approvals" className="mt-0">
              <ApprovalSettings />
            </TabsContent>
          )}

          {canViewSMTP && (
            <TabsContent value="smtp" className="mt-0">
              <SMTPSettings />
            </TabsContent>
          )}

          {canViewNotifications && (
            <TabsContent value="notifications" className="mt-0">
              <NotificationSettings />
            </TabsContent>
          )}

          {canViewEmailTemplates && (
            <TabsContent value="email-templates" className="mt-0">
              <EmailTemplateEditor />
            </TabsContent>
          )}

          {canViewBranding && (
            <TabsContent value="branding" className="mt-0">
              <CompanyBranding />
            </TabsContent>
          )}
          {canViewEmployeeCodes && (
            <TabsContent value="employee-codes" className="mt-0">
              <EmployeeCodeSettings />
            </TabsContent>
          )}
          {canViewShifts && (
            <TabsContent value="shifts" className="mt-0">
              <ShiftManagement />
            </TabsContent>
          )}
          {canViewBranchRestDays && (
            <TabsContent value="branch-rest-days" className="mt-0">
              <BranchRestDays />
            </TabsContent>
          )}
          {canViewPayrollRules && (
            <TabsContent value="payroll-rules" className="mt-0">
              <PayrollRulesSettings />
            </TabsContent>
          )}
          {canViewRotation && (
            <TabsContent value="rotation-groups" className="mt-0">
              <RotationGroups />
            </TabsContent>
          )}
          {canViewRotation && (
            <TabsContent value="rotation-patterns" className="mt-0">
              <RotationPatterns />
            </TabsContent>
          )}
          {canViewRotation && (
            <TabsContent value="rotation-assignments" className="mt-0">
              <RotationAssignments />
            </TabsContent>
          )}
          {canViewRotation && (
            <TabsContent value="employee-rotation" className="mt-0">
              <EmployeeRotation />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default Setting;
