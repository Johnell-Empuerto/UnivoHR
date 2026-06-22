"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Globe, Info } from "lucide-react";
import { getSetting, updateSetting } from "@/services/settingsService";

const TIMEZONES = [
  "Asia/Manila",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Hong_Kong",
  "Asia/Seoul",
  "Asia/Dubai",
  "UTC",
];

const CompanyTimezoneSettings = () => {
  const [timezone, setTimezone] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTimezone();
  }, []);

  const fetchTimezone = async () => {
    try {
      setLoading(true);
      const result = await getSetting("company_timezone");
      setTimezone(result.value || "Asia/Manila");
    } catch (error) {
      console.error("Failed to fetch company timezone:", error);
      toast.error("Failed to load company timezone setting");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (value: string) => {
    const previous = timezone;
    setTimezone(value);
    setSaving(true);
    try {
      await updateSetting("company_timezone", value);
      toast.success(`Company timezone updated to ${value}`);
    } catch (error: any) {
      setTimezone(previous);
      toast.error(error?.response?.data?.message || "Failed to update timezone");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Company Default Timezone</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Sets the fallback timezone used when a branch or employee has no
              timezone assigned
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading timezone setting...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-timezone">Timezone</Label>
              <Select value={timezone} onValueChange={handleChange}>
                <SelectTrigger
                  id="company-timezone"
                  className="w-full sm:w-72"
                  disabled={saving}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {saving && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </div>
              )}
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-3">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Fallback order: Device branch timezone → Employee branch
                timezone → Company default timezone → Asia/Manila
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyTimezoneSettings;
