"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type OvertimeFormProps = {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
};

const OvertimeForm = ({ onSubmit, isLoading = false }: OvertimeFormProps) => {
  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    reason: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    let hours = endHour - startHour;
    let minutes = endMinute - startMinute;
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    return parseFloat((hours + minutes / 60).toFixed(2));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date: format(date, "yyyy-MM-dd") }));
      if (errors.date) {
        setErrors((prev) => ({ ...prev, date: "" }));
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.start_time) newErrors.start_time = "Start time is required";
    if (!formData.end_time) newErrors.end_time = "End time is required";
    if (!formData.reason?.trim()) newErrors.reason = "Reason is required";

    if (formData.start_time && formData.end_time) {
      const hours = calculateHours(formData.start_time, formData.end_time);
      if (hours <= 0) {
        newErrors.end_time = "End time must be after start time";
      }
      if (hours > 12) {
        newErrors.end_time = "Overtime cannot exceed 12 hours";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const hours = calculateHours(formData.start_time, formData.end_time);
    await onSubmit({ ...formData, hours });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date Field */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm font-medium">
          Date <span className="text-red-500">*</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.date && "text-muted-foreground",
                errors.date && "border-red-500",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.date
                ? format(new Date(formData.date), "PPP")
                : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.date ? new Date(formData.date) : undefined}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
      </div>

      {/* Time Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time" className="text-sm font-medium">
            Start Time <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className={cn("pl-9", errors.start_time && "border-red-500")}
            />
          </div>
          {errors.start_time && (
            <p className="text-xs text-red-500">{errors.start_time}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time" className="text-sm font-medium">
            End Time <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              id="end_time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              className={cn("pl-9", errors.end_time && "border-red-500")}
            />
          </div>
          {errors.end_time && (
            <p className="text-xs text-red-500">{errors.end_time}</p>
          )}
        </div>
      </div>

      {/* Calculated Hours Preview */}
      {formData.start_time && formData.end_time && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            Total Overtime Hours:{" "}
            <span className="font-semibold text-foreground">
              {calculateHours(formData.start_time, formData.end_time)} hours
            </span>
          </p>
        </div>
      )}

      {/* Reason Field */}
      <div className="space-y-2">
        <Label htmlFor="reason" className="text-sm font-medium">
          Reason <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="reason"
          name="reason"
          placeholder="Describe the reason for overtime..."
          value={formData.reason}
          onChange={handleChange}
          rows={4}
          className={cn(errors.reason && "border-red-500")}
        />
        {errors.reason && (
          <p className="text-xs text-red-500">{errors.reason}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Overtime Request
        </Button>
      </div>
    </form>
  );
};

export default OvertimeForm;
