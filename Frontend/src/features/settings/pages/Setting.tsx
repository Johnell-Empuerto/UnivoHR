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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ">
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
        className="space-y-6"
      >
        <TabsList className="flex w-full gap-2 overflow-x-auto">
          {canViewAttendance && <TabsTrigger value="attendance">Attendance</TabsTrigger>}
          {canViewPayRules && <TabsTrigger value="payrules">Pay Rules</TabsTrigger>}
          {canViewApprovals && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
          {canViewSMTP && <TabsTrigger value="smtp">SMTP</TabsTrigger>}
          {canViewNotifications && <TabsTrigger value="notifications">Notifications</TabsTrigger>}
          {canViewEmailTemplates && <TabsTrigger value="email-templates">Email Templates</TabsTrigger>}
          {canViewBranding && <TabsTrigger value="branding">Branding</TabsTrigger>}
        </TabsList>

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
      </Tabs>
    </div>
  );
};

export default Setting;
