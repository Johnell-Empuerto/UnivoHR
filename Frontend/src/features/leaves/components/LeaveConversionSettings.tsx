"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, DollarSign, Shield, Settings2, Infinity } from "lucide-react";
import {
  getLeaveTypes,
  getConversionSettings,
  updateLeaveType,
  updateConversionSettings,
  saveAllConversionSettings,
} from "@/services/leaveService";

interface LeaveTypeConfig {
  id: number;
  code: string;
  name: string;
  is_convertible: boolean;
  max_convertible_days: number | null;
  requires_balance: boolean;
  is_paid: boolean;
}

interface CompanySettings {
  enforce_sil: boolean;
  sil_min_days: number;
  conversion_rate: number;
}

const LeaveConversionSettings = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    enforce_sil: true,
    sil_min_days: 5,
    conversion_rate: 1.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("leave_types");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const [types, settings] = await Promise.all([
        getLeaveTypes(),
        getConversionSettings(),
      ]);

      setLeaveTypes(types);

      setCompanySettings({
        enforce_sil: settings?.enforce_sil ?? true,
        sil_min_days: settings?.sil_min_days ?? 5,
        conversion_rate: settings?.conversion_rate ?? 1.0,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load conversion settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConvertible = async (
    id: number,
    isConvertible: boolean,
  ) => {
    try {
      await updateLeaveType(id, { is_convertible: isConvertible });

      setLeaveTypes((prev) =>
        prev.map((type) =>
          type.id === id ? { ...type, is_convertible: isConvertible } : type,
        ),
      );

      toast.success(`Conversion ${isConvertible ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update conversion setting");
    }
  };

  const handleMaxDaysChange = async (id: number, value: string) => {
    const maxDays =
      value === "" || value === "unlimited" ? null : parseInt(value);

    if (maxDays !== null && (isNaN(maxDays) || maxDays < 0)) {
      toast.error("Please enter a valid number");
      return;
    }

    try {
      await updateLeaveType(id, { max_convertible_days: maxDays });

      setLeaveTypes((prev) =>
        prev.map((type) =>
          type.id === id ? { ...type, max_convertible_days: maxDays } : type,
        ),
      );

      toast.success("Max conversion days updated");
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update max days");
    }
  };

  const handleCompanySettingChange = async (
    key: keyof CompanySettings,
    value: any,
  ) => {
    try {
      await updateConversionSettings({ [key]: value });

      setCompanySettings((prev) => ({ ...prev, [key]: value }));

      toast.success("Company settings updated");
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update settings");
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await saveAllConversionSettings(leaveTypes, companySettings);
      toast.success("All conversion settings saved successfully");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Leave Conversion Settings</h2>
          <p className="text-muted-foreground">
            Configure which leave types can be converted to cash at year-end
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save All Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="leave_types">Leave Types</TabsTrigger>
          <TabsTrigger value="company_rules">Company Rules</TabsTrigger>
        </TabsList>

        {/* LEAVE TYPES TAB */}
        <TabsContent value="leave_types" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Convertible Leave Types
              </CardTitle>
              <CardDescription>
                Enable/disable leave conversion and set maximum convertible days
                per leave type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {leaveTypes.map((type, index) => (
                <div key={type.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{type.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Code: {type.code} • {type.is_paid ? "Paid" : "Unpaid"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Label
                          htmlFor={`convertible-${type.id}`}
                          className="text-sm"
                        >
                          Convertible to Cash
                        </Label>
                        <Switch
                          id={`convertible-${type.id}`}
                          checked={type.is_convertible}
                          onCheckedChange={(checked) =>
                            handleToggleConvertible(type.id, checked)
                          }
                        />
                      </div>
                    </div>

                    {type.is_convertible && (
                      <div className="ml-6 pl-4 border-l-2 border-primary/30">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <Label
                            htmlFor={`max-days-${type.id}`}
                            className="w-40"
                          >
                            Maximum Convertible Days
                          </Label>
                          <div className="flex-1 max-w-xs">
                            <div className="relative">
                              <Input
                                id={`max-days-${type.id}`}
                                type="text"
                                value={
                                  type.max_convertible_days === null
                                    ? "unlimited"
                                    : type.max_convertible_days
                                }
                                onChange={(e) =>
                                  handleMaxDaysChange(type.id, e.target.value)
                                }
                                className="pr-20"
                                placeholder="unlimited"
                              />
                              {type.max_convertible_days === null ? (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Infinity className="h-4 w-4 text-muted-foreground" />
                                </div>
                              ) : (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  days
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {type.max_convertible_days === null
                              ? "Company allows unlimited conversion"
                              : `Company policy: Maximum ${type.max_convertible_days} day${type.max_convertible_days !== 1 ? "s" : ""} can be converted (upper limit)`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPANY RULES TAB - UI/UX IMPROVED */}
        <TabsContent value="company_rules" className="mt-6 space-y-4">
          {/* SIL Compliance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SIL Compliance (Philippines)
              </CardTitle>
              <CardDescription>
                Standard Incentive Leave (SIL) compliance for Philippine
                companies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <Label htmlFor="enforce-sil" className="font-medium">
                    Enforce SIL Compliance
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Apply Philippine labor code guidelines for leave conversion
                  </p>
                </div>
                <Switch
                  id="enforce-sil"
                  checked={companySettings.enforce_sil}
                  onCheckedChange={(checked) =>
                    handleCompanySettingChange("enforce_sil", checked)
                  }
                />
              </div>

              {companySettings.enforce_sil && (
                <div className="ml-6 pl-4 border-l-2 border-primary/30">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Label htmlFor="sil-min-days" className="w-40">
                      Target Convertible Days
                    </Label>
                    <div className="flex-1 max-w-xs">
                      <Input
                        id="sil-min-days"
                        type="number"
                        min={0}
                        max={30}
                        value={companySettings.sil_min_days}
                        onChange={(e) =>
                          handleCompanySettingChange(
                            "sil_min_days",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      If employee has at least this many unused leave days, up
                      to this amount will be targeted for conversion
                    </p>
                  </div>

                  {/* Help text to clarify the logic */}
                  <div className="mt-3 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <span className="font-medium">📌 How this works:</span> SIL
                    encourages up to {companySettings.sil_min_days} day
                    {companySettings.sil_min_days !== 1 ? "s" : ""} of
                    conversion when available — employees with fewer days
                    convert only what they have.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Rate Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cash Conversion Rate
              </CardTitle>
              <CardDescription>
                How unconverted leave days are calculated for cash payout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Label htmlFor="conversion-rate" className="w-40">
                  Daily Rate Multiplier
                </Label>
                <div className="flex-1 max-w-xs">
                  <Input
                    id="conversion-rate"
                    type="number"
                    step="0.05"
                    min={0.5}
                    max={2.0}
                    value={companySettings.conversion_rate}
                    onChange={(e) =>
                      handleCompanySettingChange(
                        "conversion_rate",
                        parseFloat(e.target.value) || 1.0,
                      )
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cash = (Daily Rate) × (Multiplier) × (Convertible Days)
                </p>
              </div>

              {/* Example Preview */}
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-2">Example Calculation:</p>
                <div className="space-y-1 text-sm">
                  <p>Employee Daily Rate: ₱1,000.00</p>
                  <p>Multiplier: {companySettings.conversion_rate}x</p>
                  <p>Convertible Days: 5</p>
                  <Separator className="my-2" />
                  <p className="font-semibold">
                    Cash Payout: ₱
                    {(
                      1000 *
                      companySettings.conversion_rate *
                      5
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Summary - IMPROVED CLARITY */}
          <Card>
            <CardHeader>
              <CardTitle>Current Configuration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between flex-wrap items-start">
                  <span className="text-muted-foreground">
                    Convertible Leave Types:
                  </span>
                  <span className="font-medium text-right">
                    {leaveTypes
                      .filter((t) => t.is_convertible)
                      .map((t) => t.name)
                      .join(", ") || "None"}
                  </span>
                </div>

                {leaveTypes.filter(
                  (t) => t.is_convertible && t.max_convertible_days !== null,
                ).length > 0 && (
                  <div className="flex justify-between flex-wrap items-start">
                    <span className="text-muted-foreground">
                      Company Policy Limits (Upper Bound):
                    </span>
                    <span className="font-medium text-right">
                      {leaveTypes
                        .filter(
                          (t) =>
                            t.is_convertible && t.max_convertible_days !== null,
                        )
                        .map(
                          (t) =>
                            `${t.name}: ${t.max_convertible_days} day${t.max_convertible_days !== 1 ? "s" : ""}`,
                        )
                        .join(", ") || "None"}
                    </span>
                  </div>
                )}

                <div className="flex justify-between flex-wrap items-start">
                  <span className="text-muted-foreground">SIL Guideline:</span>
                  <span className="font-medium text-right">
                    {companySettings.enforce_sil
                      ? `Target up to ${companySettings.sil_min_days} day${companySettings.sil_min_days !== 1 ? "s" : ""} when available`
                      : "Not enforced"}
                  </span>
                </div>

                <div className="flex justify-between flex-wrap">
                  <span className="text-muted-foreground">
                    Conversion Rate:
                  </span>
                  <span className="font-medium">
                    {companySettings.conversion_rate}x daily rate
                  </span>
                </div>

                {/* Visual example of how both settings work together */}
                <Separator className="my-2" />
                <div className="mt-2 p-3 bg-muted/20 rounded-lg">
                  <p className="text-xs font-medium mb-2">
                    🔍 How limits work together (Example):
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="grid grid-cols-2 gap-1">
                      <span className="text-muted-foreground">
                        Employee has:
                      </span>
                      <span>8 unused vacation days</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <span className="text-muted-foreground">
                        Company max:
                      </span>
                      <span>
                        {leaveTypes.find((t) => t.code === "VL")
                          ?.max_convertible_days === null
                          ? "Unlimited"
                          : `${leaveTypes.find((t) => t.code === "VL")?.max_convertible_days} days`}
                      </span>
                    </div>
                    {companySettings.enforce_sil && (
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">
                          SIL target:
                        </span>
                        <span>
                          {companySettings.sil_min_days} days (if available)
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1 pt-1 border-t mt-1">
                      <span className="font-medium">Will convert:</span>
                      <span className="font-medium">
                        {companySettings.enforce_sil
                          ? `Up to ${companySettings.sil_min_days} days`
                          : leaveTypes.find((t) => t.code === "VL")
                                ?.max_convertible_days === null
                            ? "Up to 8 days"
                            : `Up to ${Math.min(8, leaveTypes.find((t) => t.code === "VL")?.max_convertible_days || 8)} days`}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Employee always converts only what they have — never
                    forced beyond available balance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaveConversionSettings;
