"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/Input";
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
  updateRule,
  toggleRule,
  type NotificationRule,
} from "@/services/notificationRuleService";
import { useNotificationRules } from "@/hooks/useNotificationRules";

const MODULE_LABELS: Record<string, string> = {
  system: "Security",
  attendance: "Attendance Alerts",
  leave: "Leave Notifications",
  overtime: "Overtime Notifications",
  man_hours: "Man Hours Notifications",
  payroll: "Payroll Notifications",
};

const MODULE_ICONS: Record<string, React.ElementType> = {
  system: Shield,
  attendance: AlertTriangle,
  leave: Mail,
  overtime: Mail,
  man_hours: Mail,
  payroll: Mail,
};

const getModuleIcon = (module: string) => {
  const Icon = MODULE_ICONS[module];
  return Icon ? <Icon className="h-4 w-4" /> : <Bell className="h-4 w-4 text-muted-foreground" />;
};

const FREQUENCY_OPTIONS = [
  { value: "immediate", label: "Immediate" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const THRESHOLD_COUNT_OPTIONS = [1, 2, 3, 5, 7, 10];
const THRESHOLD_DAYS_OPTIONS = [1, 3, 7, 14, 30];

const getRuleIcon = (ruleKey: string) => {
  if (ruleKey.includes("leave_approved") || ruleKey.includes("overtime_approved") || ruleKey.includes("man_hour_approved"))
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (ruleKey.includes("leave_rejected") || ruleKey.includes("overtime_rejected") || ruleKey.includes("man_hour_rejected"))
    return <XCircle className="h-4 w-4 text-red-500" />;
  if (ruleKey.includes("payroll"))
    return <Mail className="h-4 w-4 text-blue-500" />;
  if (ruleKey.includes("login") || ruleKey.includes("2fa"))
    return <Shield className="h-4 w-4 text-purple-500" />;
  if (ruleKey.includes("late") || ruleKey.includes("absent") || ruleKey.startsWith("anomaly"))
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <Bell className="h-4 w-4 text-muted-foreground" />;
};

const NotificationSettings = () => {
  const { data: rulesResponse, isLoading } = useNotificationRules();
  const queryClient = useQueryClient();
  const rules = rulesResponse?.data ?? [];
  const [toggling, setToggling] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const handleToggle = async (ruleKey: string, field: "is_enabled" | "in_app_enabled" | "email_enabled") => {
    try {
      setToggling(`${ruleKey}:${field}`);
      const response = await toggleRule(ruleKey, field);
      queryClient.setQueryData(["notification-rules"], (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((r: NotificationRule) => (r.rule_key === ruleKey ? response.data : r)) };
      });
    } catch (error) {
      console.error("Failed to toggle rule:", error);
      toast.error("Failed to update setting");
    } finally {
      setToggling(null);
    }
  };

  const handleUpdate = async (ruleKey: string, payload: Partial<NotificationRule>) => {
    try {
      setSaving(ruleKey);
      const response = await updateRule(ruleKey, payload);
      queryClient.setQueryData(["notification-rules"], (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((r: NotificationRule) => (r.rule_key === ruleKey ? response.data : r)) };
      });
      toast.success("Setting updated successfully");
    } catch (error) {
      console.error("Failed to update rule:", error);
      toast.error("Failed to update setting");
    } finally {
      setSaving(null);
    }
  };

  const groupedRules = rules
    .filter((r) => r.rule_key !== "login_otp")
    .reduce(
      (acc, rule) => {
        (acc[rule.module] = acc[rule.module] || []).push(rule);
        return acc;
      },
      {} as Record<string, NotificationRule[]>,
    );

  const loginOtpRule = rules.find((r) => r.rule_key === "login_otp");

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure in-app and email notifications for various system events
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
          Configure in-app and email notifications for various system events
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Security Section - login_otp */}
        {loginOtpRule && (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              Security
            </h3>
            <div className="space-y-4 pl-4">
              <RuleItem
                rule={loginOtpRule}
                toggling={toggling}
                saving={saving}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                showInApp={false}
              />
            </div>
          </div>
        )}

        {/* Grouped sections by module */}
        {Object.entries(groupedRules).map(([module, moduleRules]) => (
          <div key={module}>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground capitalize">
              {getModuleIcon(module)}
              {MODULE_LABELS[module] || module}
            </h3>
            <div className="space-y-4 pl-4">
              {moduleRules.map((rule) => (
                <RuleItem
                  key={rule.rule_key}
                  rule={rule}
                  toggling={toggling}
                  saving={saving}
                  onToggle={handleToggle}
                  onUpdate={handleUpdate}
                  showInApp={true}
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

interface RuleItemProps {
  rule: NotificationRule;
  toggling: string | null;
  saving: string | null;
  onToggle: (ruleKey: string, field: "is_enabled" | "in_app_enabled" | "email_enabled") => void;
  onUpdate: (ruleKey: string, payload: Partial<NotificationRule>) => void;
  showInApp: boolean;
}

const RuleItem = ({ rule, toggling, saving, onToggle, onUpdate, showInApp }: RuleItemProps) => {
  const hasThresholds = rule.threshold_count !== null || rule.threshold_days !== null ||
    rule.threshold_hours !== null || rule.threshold_percent !== null;
  const isSaving = saving === rule.rule_key;

  const saveHours = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim();
      if (raw === "") return;
      const val = Number(raw);
      if (!isNaN(val) && val !== rule.threshold_hours) {
        onUpdate(rule.rule_key, { threshold_hours: val });
      }
    },
    [rule.rule_key, rule.threshold_hours, onUpdate],
  );

  const savePercent = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim();
      if (raw === "") return;
      const val = Number(raw);
      if (!isNaN(val) && val !== rule.threshold_percent) {
        onUpdate(rule.rule_key, { threshold_percent: val });
      }
    },
    [rule.rule_key, rule.threshold_percent, onUpdate],
  );

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getRuleIcon(rule.rule_key)}
          <div>
            <p className="font-medium">{rule.name}</p>
            {rule.description && (
              <p className="text-sm text-muted-foreground">
                {rule.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {showInApp && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground cursor-pointer">
                In-App
              </Label>
              <Switch
                checked={rule.in_app_enabled}
                onCheckedChange={() => onToggle(rule.rule_key, "in_app_enabled")}
                disabled={toggling === `${rule.rule_key}:in_app_enabled`}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground cursor-pointer">
              Email
            </Label>
            <Switch
              checked={rule.email_enabled}
              onCheckedChange={() => onToggle(rule.rule_key, "email_enabled")}
              disabled={toggling === `${rule.rule_key}:email_enabled`}
            />
          </div>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <div className="ml-6 p-4 bg-muted/30 rounded-lg border space-y-3">
        {hasThresholds && (
          <>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Thresholds</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {rule.threshold_count !== null && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Count
                  </Label>
                  <Select
                    value={String(rule.threshold_count)}
                    onValueChange={(v) => onUpdate(rule.rule_key, { threshold_count: Number(v) })}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THRESHOLD_COUNT_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {rule.threshold_days !== null && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Days
                  </Label>
                  <Select
                    value={String(rule.threshold_days)}
                    onValueChange={(v) => onUpdate(rule.rule_key, { threshold_days: Number(v) })}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THRESHOLD_DAYS_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} {n === 1 ? "day" : "days"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {rule.threshold_hours !== null && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Hours
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    className="w-20 h-8"
                    defaultValue={rule.threshold_hours ?? ""}
                    onBlur={saveHours}
                    disabled={isSaving}
                  />
                </div>
              )}
              {rule.threshold_percent !== null && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Percent ({(rule.threshold_percent ?? 0) * 100}%)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className="w-20 h-8"
                    defaultValue={rule.threshold_percent ?? ""}
                    onBlur={savePercent}
                    disabled={isSaving}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Frequency */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Frequency</Label>
          <Select
            value={rule.frequency}
            onValueChange={(v) => onUpdate(rule.rule_key, { frequency: v })}
            disabled={isSaving}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isSaving && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
