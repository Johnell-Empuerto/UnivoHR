"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { X, Plus, Clock, AlertCircle } from "lucide-react";
import type { ManHourDetail } from "@/services/manHourReportService";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type Props = {
  details: ManHourDetail[];
  onChange: (details: ManHourDetail[]) => void;
  disabled?: boolean;
};

// Helper function to calculate duration between two times
const calculateDurationMinutes = (timeFrom: string, timeTo: string): number => {
  if (!timeFrom || !timeTo) return 0;

  const [fromHour, fromMin] = timeFrom.split(":").map(Number);
  const [toHour, toMin] = timeTo.split(":").map(Number);
  const fromMinutes = fromHour * 60 + fromMin;
  const toMinutes = toHour * 60 + toMin;

  if (toMinutes <= fromMinutes) return 0;
  return toMinutes - fromMinutes;
};

// Format minutes to readable string
const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
};

// Check if a time range likely includes break time
const hasBreakTimeWarning = (timeFrom: string, timeTo: string): boolean => {
  if (!timeFrom || !timeTo) return false;
  // Typical 8-5 workday with break
  return (
    (timeFrom === "08:00" && timeTo === "17:00") ||
    (timeFrom === "09:00" && timeTo === "18:00")
  );
};

const TimeEntryForm = ({ details, onChange, disabled = false }: Props) => {
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [hasWarning, setHasWarning] = useState(false);

  // Calculate total hours whenever details change
  useEffect(() => {
    let total = 0;
    let warning = false;

    for (const detail of details) {
      const duration = calculateDurationMinutes(
        detail.time_from,
        detail.time_to,
      );
      total += duration;

      // Check for potential break time issue
      if (hasBreakTimeWarning(detail.time_from, detail.time_to)) {
        warning = true;
      }
    }

    setTotalMinutes(total);
    setHasWarning(warning);
  }, [details]);

  const addEntry = () => {
    onChange([
      ...details,
      { time_from: "09:00", time_to: "12:00", activity: "" }, // Default split into morning
    ]);
  };

  const addAfternoonEntry = () => {
    onChange([
      ...details,
      { time_from: "13:00", time_to: "17:00", activity: "" }, // Default afternoon
    ]);
  };

  const removeEntry = (index: number) => {
    onChange(details.filter((_, i) => i !== index));
  };

  const updateEntry = (
    index: number,
    field: keyof ManHourDetail,
    value: string,
  ) => {
    const updated = [...details];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const totalHours = (totalMinutes / 60).toFixed(1);
  const isValidTotal = totalMinutes > 0 && totalMinutes <= 1440; // 24 hours max

  return (
    <div className="space-y-4">
      {/* Header with Label and Tips */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-base font-semibold">Time Entries *</Label>

          {/* Total Hours Display */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant={isValidTotal ? "default" : "destructive"}
              className={
                !isValidTotal
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }
            >
              Total: {totalHours} hrs
            </Badge>
          </div>
        </div>

        {/* Tip Box */}
        <div className="mb-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                💡 Tip: Exclude break time (e.g., 12:00–13:00)
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Example: 08:00–12:00 Work, 13:00–17:00 Work
              </p>
              {hasWarning && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Long continuous hours detected. Consider splitting around
                  lunch break.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Add Entry Buttons */}
        {!disabled && (
          <div className="flex gap-2 mb-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEntry}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Entry
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAfternoonEntry}
              className="text-blue-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Afternoon Entry
            </Button>
          </div>
        )}
      </div>

      {/* Time Entries List */}
      <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
        {details.map((entry, index) => {
          const entryDuration = calculateDurationMinutes(
            entry.time_from,
            entry.time_to,
          );
          const hasBreakIssue = hasBreakTimeWarning(
            entry.time_from,
            entry.time_to,
          );

          return (
            <div
              key={index}
              className={`p-3 border rounded-lg space-y-2 transition-all ${
                hasBreakIssue
                  ? "border-amber-300 bg-amber-50/30 dark:bg-amber-950/10"
                  : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Entry {index + 1}
                  </span>
                  {entryDuration > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {formatDuration(entryDuration)}
                    </Badge>
                  )}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    className="p-1 hover:bg-destructive/10 rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={entry.time_from}
                    onChange={(e) =>
                      updateEntry(index, "time_from", e.target.value)
                    }
                    disabled={disabled}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">End Time</Label>
                  <Input
                    type="time"
                    value={entry.time_to}
                    onChange={(e) =>
                      updateEntry(index, "time_to", e.target.value)
                    }
                    disabled={disabled}
                    className="h-9"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Activity Description</Label>
                <Input
                  value={entry.activity}
                  onChange={(e) =>
                    updateEntry(index, "activity", e.target.value)
                  }
                  placeholder="e.g., Meeting, Development, Testing..."
                  disabled={disabled}
                  className="h-9"
                />
              </div>

              {/* Individual entry warning */}
              {hasBreakIssue && entry.time_from && entry.time_to && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Consider splitting this into morning and afternoon entries
                </p>
              )}
            </div>
          );
        })}

        {details.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No time entries added.</p>
            <p className="text-xs mt-1">
              Click "Add Entry" to start recording your work hours.
            </p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {details.length > 0 && (
        <div className="pt-3 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Working Hours:</span>
            <span
              className={`font-semibold ${!isValidTotal ? "text-red-600" : "text-green-600"}`}
            >
              {formatDuration(totalMinutes)}
            </span>
          </div>
          {!isValidTotal && totalMinutes > 0 && (
            <p className="text-xs text-red-600 mt-1">
              Total hours exceed 24 hours. Please adjust your entries.
            </p>
          )}
          {totalMinutes === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Please add at least one valid time entry.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeEntryForm;
