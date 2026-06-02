import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Hash, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  getAllSettings,
  updateSetting,
  getNextEmployeeCode,
} from "@/services/settingsService";

const EmployeeCodeSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    employee_code_auto_generate: "true",
    employee_code_prefix: "EMP",
    employee_code_separator: "",
    employee_code_padding: "4",
    employee_code_counter: "0",
  });
  const [preview, setPreview] = useState<{
    nextCode: string;
    nextNumber: number;
    format: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    updatePreview();
  }, [settings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getAllSettings();
      const map = new Map(data.map((s) => [s.key, s.value]));
      setSettings({
        employee_code_auto_generate:
          map.get("employee_code_auto_generate") || "true",
        employee_code_prefix: map.has("employee_code_prefix")
          ? map.get("employee_code_prefix")
          : "EMP",
        employee_code_separator: map.get("employee_code_separator") || "",
        employee_code_padding: map.get("employee_code_padding") || "4",
        employee_code_counter: map.get("employee_code_counter") || "0",
      });
    } catch {
      toast.error("Failed to load employee code settings");
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = () => {
    const prefix = settings.employee_code_prefix;
    const separator = settings.employee_code_separator;
    const padding = Math.max(0, parseInt(settings.employee_code_padding) || 0);
    const counter = Math.max(0, parseInt(settings.employee_code_counter) || 0);
    const nextNumber = counter + 1;
    const formattedNumber =
      padding > 0
        ? String(nextNumber).padStart(padding, "0")
        : String(nextNumber);
    const nextCode = `${prefix}${separator}${formattedNumber}`;
    const fmt = `${prefix}${separator}${padding > 0 ? "#".repeat(padding) : "N"}`;
    setPreview({ nextCode, nextNumber, format: fmt });
  };

  const fetchPreviewFromDb = async () => {
    try {
      setPreviewLoading(true);
      const result = await getNextEmployeeCode();
      setPreview({
        nextCode: result.nextCode,
        nextNumber: result.nextNumber,
        format: result.format,
      });
    } catch {
      toast.error("Failed to fetch next code from database");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    try {
      setSaving(key);
      await updateSetting(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch {
      toast.error(`Failed to save ${key}`);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="h-5 w-5" /> Employee Code Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Auto Generate Toggle - Updated to use Switch component */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Auto Generation</p>
              <p className="text-xs text-muted-foreground">
                Automatically generate employee codes for new employees
              </p>
            </div>
            <Switch
              checked={settings.employee_code_auto_generate === "true"}
              onCheckedChange={(checked) =>
                handleSave(
                  "employee_code_auto_generate",
                  checked ? "true" : "false",
                )
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Prefix (optional)
              </p>
              <input
                type="text"
                value={settings.employee_code_prefix}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    employee_code_prefix: e.target.value,
                  }))
                }
                onBlur={(e) => {
                  handleSave("employee_code_prefix", e.target.value);
                }}
                className="w-full border rounded px-2 py-1 bg-background text-sm"
                placeholder="EMP"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground mt-0.5">
                e.g., EMP, MCF, or blank for numeric codes
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Separator (optional)
              </p>
              <input
                type="text"
                value={settings.employee_code_separator}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    employee_code_separator: e.target.value,
                  }))
                }
                onBlur={(e) => {
                  handleSave("employee_code_separator", e.target.value);
                }}
                className="w-full border rounded px-2 py-1 bg-background text-sm"
                placeholder="- / . _"
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground mt-0.5">
                e.g., -, /, ., _ or blank
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Number Format
              </p>
              <select
                value={settings.employee_code_padding}
                onChange={(e) => {
                  setSettings((p) => ({
                    ...p,
                    employee_code_padding: e.target.value,
                  }));
                  handleSave("employee_code_padding", e.target.value);
                }}
                className="w-full border rounded px-2 py-1 bg-background text-sm"
              >
                <option value="0">No zero padding (1)</option>
                <option value="3">3 digits (001)</option>
                <option value="4">4 digits (0001)</option>
                <option value="5">5 digits (00001)</option>
              </select>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Current Counter <span className="text-red-500">*</span>
              </p>
              <input
                type="number"
                value={settings.employee_code_counter}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    employee_code_counter: e.target.value,
                  }))
                }
                onBlur={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setSettings((p) => ({
                    ...p,
                    employee_code_counter: String(val),
                  }));
                  handleSave("employee_code_counter", String(val));
                }}
                className="w-full border rounded px-2 py-1 bg-background text-sm"
                min={0}
              />
              <p className="text-xs text-muted-foreground mt-0.5">
                Last used number. Next = Counter + 1.
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> Preview
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPreviewFromDb}
                disabled={previewLoading}
                className="text-xs"
              >
                {previewLoading && (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                )}
                Check Next Code
              </Button>
            </div>
            <div className="p-3 bg-muted/30 rounded border text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Format:</span>{" "}
                <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">
                  {preview?.format || "Prefix + Separator + Number"}
                </code>
              </p>
              <p>
                <span className="text-muted-foreground">Next Number:</span>{" "}
                <span className="font-semibold">
                  {preview?.nextNumber ?? "—"}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">
                  Next Employee Code:
                </span>{" "}
                <span className="font-mono font-bold text-lg text-blue-700">
                  {preview?.nextCode || "—"}
                </span>
              </p>
            </div>
          </div>

          <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Note:</strong> Changes apply immediately to new employee
              creation and applicant-to-employee conversion. Existing employee
              codes will not be changed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeCodeSettings;
