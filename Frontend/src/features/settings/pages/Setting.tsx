"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import AttendanceSettings from "../components/AttendanceSettings";
import PayRulesSettings from "../components/PayRulesSettings";
import SMTPSettings from "../components/SMTPSettings";
import ApprovalSettings from "../components/ApprovalSettings";
import NotificationSettings from "../components/NotificationSettings";
import EmailTemplateEditor from "../components/EmailTemplateEditor";
import CompanyBranding from "../components/CompanyBranding";

const Setting = () => {
  const [activeTab, setActiveTab] = useState("attendance");

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ">
          <Settings className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
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
        <TabsList className="grid w-full max-w-4xl grid-cols-7">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            Attendance
          </TabsTrigger>
          <TabsTrigger value="payrules" className="flex items-center gap-2">
            Pay Rules
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            Approvals
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            SMTP
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="email-templates"
            className="flex items-center gap-2"
          >
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-0">
          <AttendanceSettings />
        </TabsContent>

        <TabsContent value="payrules" className="mt-0">
          <PayRulesSettings />
        </TabsContent>

        <TabsContent value="approvals" className="mt-0">
          <ApprovalSettings />
        </TabsContent>

        <TabsContent value="smtp" className="mt-0">
          <SMTPSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="email-templates" className="mt-0">
          <EmailTemplateEditor />
        </TabsContent>

        <TabsContent value="branding" className="mt-0">
          <CompanyBranding />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Setting;
