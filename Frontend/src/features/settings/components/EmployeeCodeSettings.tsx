import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Loader2, Hash, Eye, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  updateSetting,
  getNextEmployeeCode,
} from "@/services/settingsService";
import { useAllSettings } from "@/hooks/useSettings";

const SETTINGS_KEYS = [
  "employee_code_auto_generate",
  "employee_code_prefix",
  "employee_code_separator",
  "employee_code_padding",
  "employee_code_counter",
];

const EmployeeCodeSettings = () => {
  const queryClient = useQueryClient();
  const { data: settingsData = [], isLoading } = useAllSettings();
  const [settings, setSettings] = useState({
    employee_code_auto_generate: "true",
    employee_code_prefix: "EMP",
    employee_code_separator: "",
    employee_code_padding: "4",
    employee_code_counter: "0",
  });

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => updateSetting(key, value),
    onSuccess: (_, { key, value }) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (_, { key }) => toast.error(`Failed to save ${key}`),
  });

  const saveAllMutation = useMutation({
    mutationFn: async () => {
      const promises = SETTINGS_KEYS.map((key) => {
        const value = settings[key as keyof typeof settings];
        return updateSetting(key, value);
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Employee code settings saved successfully");
    },
    onError: () => toast.error("Failed to save employee code settings"),
  });
  const [preview, setPreview] = useState<{
    nextCode: string;
    nextNumber: number;
    format: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (settingsData.length > 0) {
      const map = new Map(settingsData.map((s) => [s.key, s.value]));
      setSettings({
        employee_code_auto_generate:
          map.get("employee_code_auto_generate") || "true",
        employee_code_prefix: map.has("employee_code_prefix")
          ? map.get("employee_code_prefix")!
          : "EMP",
        employee_code_separator: map.get("employee_code_separator") || "",
        employee_code_padding: map.get("employee_code_padding") || "4",
        employee_code_counter: map.get("employee_code_counter") || "0",
      });
    }
  }, [settingsData]);

  useEffect(() => {
    updatePreview();
  }, [settings]);

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

  const handleSave = (key: string, value: string) => {
    saveMutation.mutate({ key, value });
  };

  const handleSaveAll = () => {
    saveAllMutation.mutate();
  };

  const isAutoGen = settings.employee_code_auto_generate === "true";
  const prefixEmpty = !settings.employee_code_prefix.trim();

  if (isLoading && settingsData.length === 0) {
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
          {isAutoGen && prefixEmpty && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Prefix is empty. Generated codes will be purely numeric (e.g.,{" "}
                {preview?.nextCode || "0001"}).
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Auto Generation</p>
              <p className="text-xs text-muted-foreground">
                Automatically generate employee codes for new employees
              </p>
            </div>
            <Switch
              checked={isAutoGen}
              onCheckedChange={(checked) =>
                handleSave(
                  "employee_code_auto_generate",
                  checked ? "true" : "false",
                )
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="employee_code_prefix">Prefix (optional)</Label>
              <Input
                id="employee_code_prefix"
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
                placeholder="EMP"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                e.g., EMP, MCF, or blank for numeric codes
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="employee_code_separator">
                Separator (optional)
              </Label>
              <Input
                id="employee_code_separator"
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
                placeholder="- / . _"
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground">
                e.g., -, /, ., _ or blank
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="employee_code_padding">Number Format</Label>
              <Select
                value={settings.employee_code_padding}
                onValueChange={(value) => {
                  setSettings((p) => ({
                    ...p,
                    employee_code_padding: value,
                  }));
                  handleSave("employee_code_padding", value);
                }}
              >
                <SelectTrigger id="employee_code_padding">
                  <SelectValue placeholder="Select padding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No zero padding (1)</SelectItem>
                  <SelectItem value="3">3 digits (001)</SelectItem>
                  <SelectItem value="4">4 digits (0001)</SelectItem>
                  <SelectItem value="5">5 digits (00001)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="employee_code_counter">
                Current Counter <span className="text-red-500">*</span>
              </Label>
              <Input
                id="employee_code_counter"
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
                min={0}
              />
              <p className="text-xs text-muted-foreground">
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

          <div className="border-t pt-4 space-y-4">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Note:</strong> Changes apply immediately to new employee
                creation and applicant-to-employee conversion. Existing employee
                codes will not be changed.
              </p>
            </div>
            <Button onClick={handleSaveAll} disabled={saveAllMutation.isPending} className="w-full">
              {saveAllMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving All Settings...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeCodeSettings;
