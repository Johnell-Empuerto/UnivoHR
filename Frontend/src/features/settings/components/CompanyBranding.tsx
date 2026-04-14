"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Building, Palette, Eye } from "lucide-react";
import {
  getAllSettings,
  updateSetting,
  type Setting,
} from "@/services/settingsService";

const CompanyBranding = () => {
  const [settings, setSettings] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Fetch all settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getAllSettings();
      const settingsMap = new Map();
      data.forEach((setting: Setting) => {
        settingsMap.set(setting.key, setting.value);
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load company settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => new Map(prev).set(key, value));
  };

  const handleSwitchChange = (key: string, checked: boolean) => {
    setSettings((prev) => new Map(prev).set(key, checked ? "true" : "false"));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const brandingKeys = [
        "company_name",
        "company_logo",
        "company_address",
        "primary_color",
        "secondary_color",
        "show_powered_by",
        "payslip_show_company_name",
        "email_show_company_name",
      ];

      const promises = [];
      for (const [key, value] of settings) {
        if (brandingKeys.includes(key)) {
          promises.push(updateSetting(key, value));
        }
      }
      await Promise.all(promises);
      toast.success("Company branding saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save company settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  const companyName = settings.get("company_name") || "";
  const primaryColor = settings.get("primary_color") || "#4F46E5";
  const secondaryColor = settings.get("secondary_color") || "#7C3AED";

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building className="h-5 w-5" />
          Company Branding
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Customize how your company appears in payslips and email notifications
        </p>
      </CardHeader>

      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={companyName}
                onChange={(e) => handleChange("company_name", e.target.value)}
                placeholder="Your Company Name (optional)"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Appears on payslips and in email headers
              </p>
            </div>

            <div>
              <Label htmlFor="company_logo">Company Logo URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="company_logo"
                  value={settings.get("company_logo") || ""}
                  onChange={(e) => handleChange("company_logo", e.target.value)}
                  placeholder="https://yourcompany.com/logo.png"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter a URL to your company logo (optional, appears in email
                headers)
              </p>
            </div>

            <div>
              <Label htmlFor="company_address">Company Address</Label>
              <Input
                id="company_address"
                value={settings.get("company_address") || ""}
                onChange={(e) =>
                  handleChange("company_address", e.target.value)
                }
                placeholder="123 Business St., City, Country"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Appears in email footers (optional)
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Display Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Company Name on Payslip</p>
                    <p className="text-sm text-muted-foreground">
                      Display company name on employee payslips
                    </p>
                  </div>
                  <Switch
                    checked={
                      settings.get("payslip_show_company_name") === "true"
                    }
                    onCheckedChange={(checked) =>
                      handleSwitchChange("payslip_show_company_name", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Company Name in Email</p>
                    <p className="text-sm text-muted-foreground">
                      Display company name in email headers
                    </p>
                  </div>
                  <Switch
                    checked={settings.get("email_show_company_name") === "true"}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("email_show_company_name", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show "Powered by UnivoHR"</p>
                    <p className="text-sm text-muted-foreground">
                      Display attribution in email footers
                    </p>
                  </div>
                  <Switch
                    checked={settings.get("show_powered_by") === "true"}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("show_powered_by", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="primary_color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) =>
                      handleChange("primary_color", e.target.value)
                    }
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) =>
                      handleChange("primary_color", e.target.value)
                    }
                    placeholder="#4F46E5"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Used for email headers and buttons
                </p>
              </div>

              <div>
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) =>
                      handleChange("secondary_color", e.target.value)
                    }
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) =>
                      handleChange("secondary_color", e.target.value)
                    }
                    placeholder="#7C3AED"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Used for email headers (gradient end)
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg mt-4">
              <p className="text-sm font-medium mb-2">Color Preview:</p>
              <div className="space-y-2">
                <div
                  className="h-10 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                  }}
                />
                <div className="flex gap-2">
                  <div
                    className="w-10 h-10 rounded-full border"
                    style={{ background: primaryColor }}
                  />
                  <div
                    className="w-10 h-10 rounded-full border"
                    style={{ background: secondaryColor }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              {/* Email Preview */}
              <div className="p-4 bg-muted/20 border-b">
                <h3 className="font-medium">Email Header Preview</h3>
              </div>
              <div className="p-4">
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                  }}
                >
                  <div className="p-6 text-center">
                    {settings.get("company_logo") ? (
                      <img
                        src={settings.get("company_logo")!}
                        alt="Company Logo"
                        className="max-h-12 mx-auto mb-2"
                      />
                    ) : (
                      <div className="text-white text-xl font-bold">
                        🏢{" "}
                        {settings.get("email_show_company_name") === "true" &&
                        companyName
                          ? companyName
                          : "UnivoHR"}
                      </div>
                    )}
                    {settings.get("email_show_company_name") === "true" &&
                      companyName && (
                        <div className="text-white/80 text-sm mt-1">
                          {companyName}
                        </div>
                      )}
                    <div className="text-white/70 text-xs mt-2">
                      HR Management System
                    </div>
                  </div>
                </div>
                <div className="p-4 text-center text-sm text-muted-foreground border-t mt-4">
                  {settings.get("show_powered_by") === "true" && (
                    <p>
                      Powered by <strong>UnivoHR</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Payslip Preview */}
            <div className="border rounded-lg overflow-hidden mt-4">
              <div className="p-4 bg-muted/20 border-b">
                <h3 className="font-medium">Payslip Preview</h3>
              </div>
              <div className="p-4">
                <div className="text-center border-b pb-3">
                  {settings.get("payslip_show_company_name") === "true" &&
                  companyName ? (
                    <div className="font-bold text-lg">{companyName}</div>
                  ) : (
                    <div className="font-bold text-lg">UnivoHR</div>
                  )}
                  <div className="text-sm text-muted-foreground">Pay Slip</div>
                </div>
                <div className="mt-3 text-sm">
                  <p>
                    <strong>Employee:</strong> John Doe
                  </p>
                  <p>
                    <strong>Period:</strong> April 1-15, 2026
                  </p>
                  <p>
                    <strong>Net Pay:</strong> ₱15,000.00
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex gap-3 pt-6 border-t mt-6">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Branding Settings"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyBranding;
