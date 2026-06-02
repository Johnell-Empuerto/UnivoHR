"use client";

import { useEffect, useState } from "react";
import {
  fetchPayrollRules,
  updatePayrollRule,
} from "@/services/payrollRulesService";
import type { PayrollRule } from "@/services/payrollRulesService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Moon, Loader2, Sun, Calculator } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PayrollRulesSettings = () => {
  const [rules, setRules] = useState<Map<string, PayrollRule>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await fetchPayrollRules();
      const map = new Map<string, PayrollRule>();
      data.forEach((r) => map.set(r.rule_key, r));
      setRules(map);
    } catch {
      toast.error("Failed to load payroll rules");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    const key = "night_differential_enabled";
    setSaving(key);
    try {
      await updatePayrollRule(key, enabled ? 1 : 0);
      const updated = new Map(rules);
      updated.set(key, {
        ...updated.get(key)!,
        rule_value: enabled ? 1 : 0,
      });
      setRules(updated);
      toast.success(
        enabled ? "Night differential enabled" : "Night differential disabled",
      );
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(null);
    }
  };

  const handleRateChange = async (percent: number) => {
    const key = "night_differential_rate";
    const decimal = Math.round(percent) / 100;
    setSaving(key);
    try {
      await updatePayrollRule(key, decimal);
      const updated = new Map(rules);
      updated.set(key, { ...updated.get(key)!, rule_value: decimal });
      setRules(updated);
      toast.success(`Night differential rate set to ${percent}%`);
    } catch {
      toast.error("Failed to update rate");
    } finally {
      setSaving(null);
    }
  };

  const handleMethodChange = async (value: string) => {
    const key = "holiday_rest_day_method";
    const numValue = parseInt(value) || 1;
    setSaving(key);
    try {
      await updatePayrollRule(key, numValue);
      const updated = new Map(rules);
      updated.set(key, { ...updated.get(key)!, rule_value: numValue });
      setRules(updated);
      const labels: Record<number, string> = {
        1: "Multiplicative",
        2: "Additive",
        3: "Max Only",
      };
      toast.success(`Holiday-on-rest-day method set to ${labels[numValue]}`);
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(null);
    }
  };

  const handleUnworkedPolicyChange =
    (key: string, label: string) => async (value: string) => {
      const numValue = parseInt(value) || 1;
      setSaving(key);
      try {
        await updatePayrollRule(key, numValue);
        const updated = new Map(rules);
        updated.set(key, { ...updated.get(key)!, rule_value: numValue });
        setRules(updated);
        const labels: Record<number, string> = {
          1: "No Pay",
          2: "Daily Rate (1×)",
          3: "Holiday Rate",
        };
        toast.success(`${label}: ${labels[numValue]}`);
      } catch {
        toast.error("Failed to update");
      } finally {
        setSaving(null);
      }
    };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const ndEnabled =
    Number(rules.get("night_differential_enabled")?.rule_value ?? 0) === 1;
  const ndRateDecimal = Number(
    rules.get("night_differential_rate")?.rule_value ?? 0.1,
  );
  const ndRatePercent = Math.round(ndRateDecimal * 100);
  const holidayMethod = Number(
    rules.get("holiday_rest_day_method")?.rule_value ?? 1,
  );
  const unworkedRegHolPolicy = Number(
    rules.get("unworked_regular_holiday_policy")?.rule_value ?? 2,
  );
  const unworkedSpecHolPolicy = Number(
    rules.get("unworked_special_holiday_policy")?.rule_value ?? 1,
  );
  const unworkedSpecNWPolicy = Number(
    rules.get("unworked_special_non_working_policy")?.rule_value ?? 1,
  );

  return (
    <div className="space-y-6">
      {/* Night Differential Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Night Differential
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Configure night differential pay for hours worked between 10:00 PM
            and 6:00 AM. The premium is applied on top of the regular hourly
            rate during payroll generation.
          </p>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="nd-toggle" className="text-base">
                Enable Night Differential
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, hours between 10PM–6AM are paid at the rate below
              </p>
            </div>
            <Switch
              id="nd-toggle"
              checked={ndEnabled}
              onCheckedChange={handleToggle}
              disabled={saving === "night_differential_enabled"}
            />
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <Label htmlFor="nd-rate" className="text-base">
              Night Differential Rate
            </Label>
            <p className="text-sm text-muted-foreground">
              Percentage premium per hour worked between 10PM–6AM
            </p>
            <div className="flex items-center gap-3">
              <Input
                id="nd-rate"
                type="number"
                min={0}
                max={100}
                step={1}
                value={ndRatePercent}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  handleRateChange(val);
                }}
                className="w-24"
                disabled={saving === "night_differential_rate"}
              />
              <span className="text-sm font-medium">%</span>
              {saving === "night_differential_rate" && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Current: {ndRateDecimal.toFixed(2)} decimal ({ndRatePercent}%)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Holiday on Rest Day Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Holiday on Rest Day
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Configure how holiday pay is computed when a holiday falls on an
            employee's rest day.
          </p>

          <div className="rounded-lg border p-4 space-y-3">
            <Label htmlFor="holiday-method" className="text-base">
              Composite Method
            </Label>
            <p className="text-sm text-muted-foreground">
              How to combine the holiday multiplier with the rest day multiplier
            </p>
            <Select
              value={String(holidayMethod)}
              onValueChange={handleMethodChange}
              disabled={saving === "holiday_rest_day_method"}
            >
              <SelectTrigger id="holiday-method" className="w-64">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Multiplicative (hol × rd)</SelectItem>
                <SelectItem value="2">Additive (hol + rd − 1)</SelectItem>
                <SelectItem value="3">Max Only (max of hol, rd)</SelectItem>
              </SelectContent>
            </Select>
            {saving === "holiday_rest_day_method" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="rounded-lg border p-3 space-y-1.5 bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground">
              Note: Only applies when employee worked
            </p>
            <p className="text-xs text-muted-foreground">
              If the employee has no attendance on the holiday, the Unworked
              Holiday Policy below is used instead.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Unworked Regular Holiday Policy Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Unworked Regular Holiday Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Applies when calendar day_type is <strong>REGULAR_HOLIDAY</strong>
            and the employee has no attendance. Does not affect leave days.
          </p>

          <div className="rounded-lg border p-4 space-y-3">
            <Label htmlFor="unworked-reg-hol" className="text-base">
              Unworked Regular Holiday Pay
            </Label>
            <p className="text-sm text-muted-foreground">
              What the employee receives for unworked regular holidays
            </p>
            <Select
              value={String(unworkedRegHolPolicy)}
              onValueChange={handleUnworkedPolicyChange(
                "unworked_regular_holiday_policy",
                "Regular Holiday",
              )}
              disabled={saving === "unworked_regular_holiday_policy"}
            >
              <SelectTrigger id="unworked-reg-hol" className="w-64">
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">No Pay</SelectItem>
                <SelectItem value="2">Daily Rate (1×)</SelectItem>
                <SelectItem value="3">Holiday Rate</SelectItem>
              </SelectContent>
            </Select>
            {saving === "unworked_regular_holiday_policy" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unworked Special Holiday Policy Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Unworked Special Holiday Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Applies when calendar day_type is <strong>SPECIAL_HOLIDAY</strong>
            and the employee has no attendance. Does not affect leave days.
          </p>

          <div className="rounded-lg border p-4 space-y-3">
            <Label htmlFor="unworked-spec-hol" className="text-base">
              Unworked Special Holiday Pay
            </Label>
            <p className="text-sm text-muted-foreground">
              What the employee receives for unworked special holidays
            </p>
            <Select
              value={String(unworkedSpecHolPolicy)}
              onValueChange={handleUnworkedPolicyChange(
                "unworked_special_holiday_policy",
                "Special Holiday",
              )}
              disabled={saving === "unworked_special_holiday_policy"}
            >
              <SelectTrigger id="unworked-spec-hol" className="w-64">
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">No Pay</SelectItem>
                <SelectItem value="2">Daily Rate (1×)</SelectItem>
                <SelectItem value="3">Holiday Rate</SelectItem>
              </SelectContent>
            </Select>
            {saving === "unworked_special_holiday_policy" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unworked Special Non-Working Policy Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Unworked Special Non-Working Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Applies when calendar day_type is{" "}
            <strong>SPECIAL_NON_WORKING</strong> and the employee has no
            attendance. Does not affect leave days.
          </p>

          <div className="rounded-lg border p-4 space-y-3">
            <Label htmlFor="unworked-spec-nw" className="text-base">
              Unworked Special Non-Working Pay
            </Label>
            <p className="text-sm text-muted-foreground">
              What the employee receives for unworked special non-working days
            </p>
            <Select
              value={String(unworkedSpecNWPolicy)}
              onValueChange={handleUnworkedPolicyChange(
                "unworked_special_non_working_policy",
                "Special Non-Working",
              )}
              disabled={saving === "unworked_special_non_working_policy"}
            >
              <SelectTrigger id="unworked-spec-nw" className="w-64">
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">No Pay</SelectItem>
                <SelectItem value="2">Daily Rate (1×)</SelectItem>
                <SelectItem value="3">Holiday Rate</SelectItem>
              </SelectContent>
            </Select>
            {saving === "unworked_special_non_working_policy" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollRulesSettings;
