"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { X, Plus, Clock, AlertCircle, Info } from "lucide-react";
import type { ManHourDetail } from "@/services/manHourReportService";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { Shift } from "@/services/shiftService";

type Props = {
  details: ManHourDetail[];
  onChange: (details: ManHourDetail[]) => void;
  disabled?: boolean;
  shiftInfo?: Shift | null;
  entriesDirty?: boolean;
  onApplyShift?: () => void;
  isFallback?: boolean;
};

const calculateDurationMinutes = (timeFrom: string, timeTo: string): number => {
  if (!timeFrom || !timeTo) return 0;

  const [fromHour, fromMin] = timeFrom.split(":").map(Number);
  const [toHour, toMin] = timeTo.split(":").map(Number);
  const fromMinutes = fromHour * 60 + fromMin;
  const toMinutes = toHour * 60 + toMin;

  if (toMinutes <= fromMinutes) return 0;
  return toMinutes - fromMinutes;
};

const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
};

const formatTimeDisplay = (time: string): string => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
};

const coversBreakWindow = (timeFrom: string, timeTo: string, shiftBreakStart?: string, shiftBreakEnd?: string): boolean => {
  if (!timeFrom || !timeTo) return false;
  const [fH, fM] = timeFrom.split(":").map(Number);
  const [tH, tM] = timeTo.split(":").map(Number);
  const start = fH * 60 + fM;
  const end = tH * 60 + tM;
  let breakStart = 11 * 60;
  let breakEnd = 13 * 60;
  if (shiftBreakStart && shiftBreakEnd) {
    const [bSH, bSM] = shiftBreakStart.split(":").map(Number);
    const [bEH, bEM] = shiftBreakEnd.split(":").map(Number);
    breakStart = bSH * 60 + bSM;
    breakEnd = bEH * 60 + bEM;
  }
  return start < breakEnd && end > breakStart;
};

const getShiftBoundsWarning = (details: ManHourDetail[], shiftStart?: string, shiftEnd?: string): boolean => {
  if (!shiftStart || !shiftEnd) return false;
  const [sH, sM] = shiftStart.slice(0, 5).split(":").map(Number);
  const [eH, eM] = shiftEnd.slice(0, 5).split(":").map(Number);
  const shiftStartMin = sH * 60 + sM;
  const shiftEndMin = eH * 60 + eM;
  return details.some((d) => {
    if (!d.time_from || !d.time_to) return false;
    const [fH, fM] = d.time_from.split(":").map(Number);
    const [tH, tM] = d.time_to.split(":").map(Number);
    const start = fH * 60 + fM;
    const end = tH * 60 + tM;
    return start < shiftStartMin || end > shiftEndMin;
  });
};

const hasOverlap = (details: ManHourDetail[]): boolean => {
  for (let i = 0; i < details.length; i++) {
    const [iFH, iFM] = details[i].time_from.split(":").map(Number);
    const [iTH, iTM] = details[i].time_to.split(":").map(Number);
    const iS = iFH * 60 + iFM;
    const iE = iTH * 60 + iTM;
    for (let j = i + 1; j < details.length; j++) {
      const [jFH, jFM] = details[j].time_from.split(":").map(Number);
      const [jTH, jTM] = details[j].time_to.split(":").map(Number);
      const jS = jFH * 60 + jFM;
      const jE = jTH * 60 + jTM;
      if (iS < jE && jS < iE) return true;
    }
  }
  return false;
};

const TimeEntryForm = ({ details, onChange, disabled = false, shiftInfo, entriesDirty = false, onApplyShift, isFallback = false }: Props) => {
  const [totalMinutes, setTotalMinutes] = useState(0);

  const overlapWarning = useMemo(() => hasOverlap(details), [details]);

  const breakWarnings = useMemo(() => {
    return details.map((d) =>
      coversBreakWindow(
        d.time_from,
        d.time_to,
        shiftInfo?.break_start ?? undefined,
        shiftInfo?.break_end ?? undefined,
      ),
    );
  }, [details, shiftInfo]);

  useEffect(() => {
    let total = 0;
    for (const detail of details) {
      total += calculateDurationMinutes(detail.time_from, detail.time_to);
    }
    setTotalMinutes(total);
  }, [details]);

  const addEntry = () => {
    onChange([
      ...details,
      { time_from: "09:00", time_to: "12:00", activity: "" },
    ]);
  };

  const addAfternoonEntry = () => {
    onChange([
      ...details,
      { time_from: "13:00", time_to: "17:00", activity: "" },
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

  const totalHoursNum = totalMinutes / 60;
  const totalHours = totalHoursNum.toFixed(1);
  const isValidTotal = totalMinutes > 0 && totalMinutes <= 1440;
  const totalMismatch: "above" | "below" | null =
    shiftInfo && totalMinutes > 0
      ? Math.abs(totalHoursNum - Number(shiftInfo.required_hours)) < 0.01
        ? null
        : totalHoursNum > Number(shiftInfo.required_hours)
          ? "above"
          : "below"
      : null;

  const shiftOutsideBounds = useMemo(
    () =>
      entriesDirty && shiftInfo
        ? getShiftBoundsWarning(
            details,
            shiftInfo.start_time,
            shiftInfo.end_time,
          )
        : false,
    [details, shiftInfo, entriesDirty],
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-base font-semibold">Time Entries *</Label>

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

        {shiftInfo && (
          <div className="mb-3 p-3 rounded-md bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Assigned Shift: {shiftInfo.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatTimeDisplay(shiftInfo.start_time)} – {formatTimeDisplay(shiftInfo.end_time)}
                  {shiftInfo.break_start && shiftInfo.break_end && (
                    <> &middot; Break: {formatTimeDisplay(shiftInfo.break_start)}–{formatTimeDisplay(shiftInfo.break_end)}</>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Expected working hours: {shiftInfo.required_hours} hrs
                </p>
              </div>
            </div>
          </div>
        )}

        {isFallback && (
          <div className="mb-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Assigned Shift: Not found
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Fallback Schedule: 09:00 AM–05:00 PM
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Expected Hours: 8 hrs
                </p>
                <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">
                  No assigned shift found for this date. Default schedule was used.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                Tip: Exclude break time (e.g., 12:00–13:00)
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Example: 08:00–12:00 Work, 13:00–17:00 Work
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                Total is calculated from your time entries. Break time is not
                automatically deducted.
              </p>
              {overlapWarning && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Overlapping time entries detected. Total hours may be inflated.
                </p>
              )}
              {totalMismatch && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Total hours ({totalHours}h) {totalMismatch === "above" ? "exceed" : "are below"} your shift&apos;s expected
                  working hours ({shiftInfo?.required_hours}h).
                </p>
              )}
              {shiftOutsideBounds && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Some entries are outside your assigned shift hours.
                </p>
              )}
            </div>
          </div>
        </div>

        {entriesDirty && shiftInfo && onApplyShift && (
          <div className="mb-3 flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-700">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300 flex-1">
              Entries modified. Click to reset to shift schedule.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={onApplyShift}>
              Apply Shift Schedule
            </Button>
          </div>
        )}

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

      <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
        {details.map((entry, index) => {
          const entryDuration = calculateDurationMinutes(
            entry.time_from,
            entry.time_to,
          );
          const hasBreakIssue = breakWarnings[index];

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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
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
                <div className="space-y-1">
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

              <div className="space-y-1">
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

              {hasBreakIssue && entry.time_from && entry.time_to && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  This entry may include break time. Consider
                  splitting around lunch.
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
