"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Shield,
  Bell,
  AlertTriangle,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  getAllSettings,
  toggleSetting,
  updateSetting,
  type Setting,
} from "@/services/settingsService";

const NotificationSettings = () => {
  const [settings, setSettings] = useState<Map<string, boolean>>(new Map());
  const [lateThreshold, setLateThreshold] = useState<string>("3");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [savingThreshold, setSavingThreshold] = useState(false);

  // Fetch all settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getAllSettings();
      const settingsMap = new Map();
      data.forEach((setting: Setting) => {
        settingsMap.set(setting.key, setting.value === "true");
        // Get late threshold value
        if (setting.key === "late_threshold_count") {
          setLateThreshold(setting.value);
        }
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Toggle setting
  const handleToggle = async (key: string) => {
    try {
      setToggling(key);
      const result = await toggleSetting(key);
      setSettings((prev) => new Map(prev).set(key, result.value));
      toast.success(
        `${getSettingLabel(key)} ${result.value ? "enabled" : "disabled"}`,
      );
    } catch (error) {
      console.error("Failed to toggle setting:", error);
      toast.error("Failed to update setting");
    } finally {
      setToggling(null);
    }
  };

  // Update late threshold
  const handleThresholdChange = async (value: string) => {
    try {
      setSavingThreshold(true);
      await updateSetting("late_threshold_count", value);
      setLateThreshold(value);
      toast.success(
        `Late threshold updated to ${value} ${value === "1" ? "day" : "days"}`,
      );
    } catch (error) {
      console.error("Failed to update threshold:", error);
      toast.error("Failed to update late threshold");
    } finally {
      setSavingThreshold(false);
    }
  };

  // Helper to get readable label
  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      enable_2fa_login_email: "2FA Login (Email)",
      enable_late_email_notice: "Late Email Notification",
      enable_absent_no_leave_email: "Absent Without Leave Email",
      notify_leave_approved: "Leave Approved",
      notify_leave_rejected: "Leave Rejected",
      notify_overtime_approved: "Overtime Approved",
      notify_overtime_rejected: "Overtime Rejected",
      notify_payroll_marked_paid: "Payroll Marked Paid",
    };
    return (
      labels[key] ||
      key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  // Helper to get description
  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      enable_2fa_login_email:
        "Require OTP verification code sent via email during login",
      enable_late_email_notice:
        "Send email notification when employee is late multiple times",
      enable_absent_no_leave_email:
        "Notify employee if marked absent without filing a leave request",
      notify_leave_approved:
        "Send email notification when a leave request is approved",
      notify_leave_rejected:
        "Send email notification when a leave request is rejected",
      notify_overtime_approved:
        "Send email notification when an overtime request is approved",
      notify_overtime_rejected:
        "Send email notification when an overtime request is rejected",
      notify_payroll_marked_paid:
        "Send email notification when payroll is marked as paid",
    };
    return descriptions[key] || "Toggle this notification on/off";
  };

  // Helper to get icon
  const getSettingIcon = (key: string) => {
    if (key.includes("leave_approved"))
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (key.includes("leave_rejected"))
      return <XCircle className="h-4 w-4 text-red-500" />;
    if (key.includes("overtime_approved"))
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (key.includes("overtime_rejected"))
      return <XCircle className="h-4 w-4 text-red-500" />;
    if (key.includes("payroll"))
      return <Mail className="h-4 w-4 text-blue-500" />;
    if (key.includes("2fa"))
      return <Shield className="h-4 w-4 text-purple-500" />;
    if (key.includes("late") || key.includes("absent"))
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <Bell className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure email notifications for various system events
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure email notifications for various system events
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Security Section */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            Security
          </h3>
          <div className="space-y-4 pl-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {getSettingLabel("enable_2fa_login_email")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getSettingDescription("enable_2fa_login_email")}
                </p>
              </div>
              <Switch
                checked={settings.get("enable_2fa_login_email") || false}
                onCheckedChange={() => handleToggle("enable_2fa_login_email")}
                disabled={toggling === "enable_2fa_login_email"}
              />
            </div>
          </div>
        </div>

        {/* Attendance Alerts Section */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Attendance Alerts
          </h3>
          <div className="space-y-4 pl-4">
            {/* Late Notice Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {getSettingLabel("enable_late_email_notice")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getSettingDescription("enable_late_email_notice")}
                </p>
              </div>
              <Switch
                checked={settings.get("enable_late_email_notice") || false}
                onCheckedChange={() => handleToggle("enable_late_email_notice")}
                disabled={toggling === "enable_late_email_notice"}
              />
            </div>

            {/* Late Threshold - only show when late notice is enabled */}
            {settings.get("enable_late_email_notice") && (
              <div className="ml-6 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="late-threshold" className="font-medium">
                    Late Threshold Count
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Number of late occurrences before sending email notification
                </p>
                <Select
                  value={lateThreshold}
                  onValueChange={handleThresholdChange}
                  disabled={savingThreshold}
                >
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Select threshold" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="2">2 days</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                  </SelectContent>
                </Select>
                {savingThreshold && (
                  <Loader2 className="h-4 w-4 animate-spin ml-2 inline" />
                )}
              </div>
            )}

            {/* Absent Without Leave Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {getSettingLabel("enable_absent_no_leave_email")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getSettingDescription("enable_absent_no_leave_email")}
                </p>
              </div>
              <Switch
                checked={settings.get("enable_absent_no_leave_email") || false}
                onCheckedChange={() =>
                  handleToggle("enable_absent_no_leave_email")
                }
                disabled={toggling === "enable_absent_no_leave_email"}
              />
            </div>
          </div>
        </div>

        {/* Leave Notifications Section */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            Leave Notifications
          </h3>
          <div className="space-y-4 pl-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSettingIcon("notify_leave_approved")}
                <div>
                  <p className="font-medium">
                    {getSettingLabel("notify_leave_approved")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getSettingDescription("notify_leave_approved")}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.get("notify_leave_approved") || false}
                onCheckedChange={() => handleToggle("notify_leave_approved")}
                disabled={toggling === "notify_leave_approved"}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSettingIcon("notify_leave_rejected")}
                <div>
                  <p className="font-medium">
                    {getSettingLabel("notify_leave_rejected")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getSettingDescription("notify_leave_rejected")}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.get("notify_leave_rejected") || false}
                onCheckedChange={() => handleToggle("notify_leave_rejected")}
                disabled={toggling === "notify_leave_rejected"}
              />
            </div>
          </div>
        </div>

        {/* Overtime Notifications Section */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            Overtime Notifications
          </h3>
          <div className="space-y-4 pl-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSettingIcon("notify_overtime_approved")}
                <div>
                  <p className="font-medium">
                    {getSettingLabel("notify_overtime_approved")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getSettingDescription("notify_overtime_approved")}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.get("notify_overtime_approved") || false}
                onCheckedChange={() => handleToggle("notify_overtime_approved")}
                disabled={toggling === "notify_overtime_approved"}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSettingIcon("notify_overtime_rejected")}
                <div>
                  <p className="font-medium">
                    {getSettingLabel("notify_overtime_rejected")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getSettingDescription("notify_overtime_rejected")}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.get("notify_overtime_rejected") || false}
                onCheckedChange={() => handleToggle("notify_overtime_rejected")}
                disabled={toggling === "notify_overtime_rejected"}
              />
            </div>
          </div>
        </div>

        {/* Payroll Notifications Section */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            Payroll Notifications
          </h3>
          <div className="space-y-4 pl-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSettingIcon("notify_payroll_marked_paid")}
                <div>
                  <p className="font-medium">
                    {getSettingLabel("notify_payroll_marked_paid")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getSettingDescription("notify_payroll_marked_paid")}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.get("notify_payroll_marked_paid") || false}
                onCheckedChange={() =>
                  handleToggle("notify_payroll_marked_paid")
                }
                disabled={toggling === "notify_payroll_marked_paid"}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
