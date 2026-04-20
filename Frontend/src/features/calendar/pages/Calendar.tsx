import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  AlertCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  getCalendar,
  createCalendarDay,
  updateCalendarDay,
  deleteCalendarDay,
  bulkUploadCalendar,
} from "@/services/calendarService";
import { useAuth } from "@/app/providers/AuthProvider";

// Import for date picker
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface CalendarDay {
  id: number;
  date: string;
  day_type:
    | "REGULAR"
    | "SPECIAL_NON_WORKING"
    | "REGULAR_HOLIDAY"
    | "SPECIAL_HOLIDAY";
  is_paid: boolean;
  description: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    day_type: string;
    is_paid: boolean;
    description: string | null;
  };
}

interface UploadResult {
  summary: {
    totalRows: number;
    inserted: number;
    updated: number;
    failed: number;
  };
  errors: string[];
}

const CalendarPage: React.FC = () => {
  const { user } = useAuth();

  // Role-based access control flags (matching backend routes)
  const canEdit = user?.role === "ADMIN" || user?.role === "HR_ADMIN";
  const canDelete = user?.role === "ADMIN" || user?.role === "HR_ADMIN";
  const canBulkUpload = user?.role === "ADMIN" || user?.role === "HR_ADMIN";
  const canDownloadTemplate =
    user?.role === "ADMIN" || user?.role === "HR_ADMIN";

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<CalendarDay | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    day_type: "REGULAR",
    is_paid: false,
    description: "",
  });

  // Bulk upload states
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [overwrite, setOverwrite] = useState(true);
  const [uploadResults, setUploadResults] = useState<UploadResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calendarRef = useRef<FullCalendar>(null);

  // State for date picker
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch calendar days for current month
  useEffect(() => {
    if (selectedDate) {
      const start = format(startOfMonth(selectedDate), "yyyy-MM-dd");
      const end = format(endOfMonth(selectedDate), "yyyy-MM-dd");
      fetchCalendarDays(start, end);
    }
  }, [selectedDate]);

  // Update events when calendarDays changes
  useEffect(() => {
    const newEvents = calendarDays.map((day) => ({
      id: day.id.toString(),
      title: getEventTitle(day.day_type, day.is_paid),
      start: day.date,
      backgroundColor: getEventColor(day.day_type),
      borderColor: getEventColor(day.day_type),
      textColor: "#ffffff",
      extendedProps: {
        day_type: day.day_type,
        is_paid: day.is_paid,
        description: day.description,
      },
    }));
    setEvents(newEvents);
  }, [calendarDays]);

  const fetchCalendarDays = async (start: string, end: string) => {
    setLoading(true);
    try {
      const data = await getCalendar(start, end);
      setCalendarDays(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch calendar days");
    } finally {
      setLoading(false);
    }
  };

  const getEventTitle = (day_type: string, is_paid: boolean) => {
    const typeLabel = getDayTypeShortLabel(day_type);
    const paidIcon = is_paid ? "💰" : "";
    return `${typeLabel} ${paidIcon}`;
  };

  const getEventColor = (day_type: string) => {
    switch (day_type) {
      case "REGULAR_HOLIDAY":
        return "#dc2626";
      case "SPECIAL_HOLIDAY":
        return "#f97316";
      case "SPECIAL_NON_WORKING":
        return "#eab308";
      default:
        return "#10b981";
    }
  };

  // Date click handler - only if user can edit
  const handleDateClick = (info: any) => {
    if (!canEdit) return;

    const clickedDate = new Date(info.dateStr);
    setSelectedDate(clickedDate);

    const existingDay = calendarDays.find((day) =>
      isSameDay(new Date(day.date), clickedDate),
    );

    if (existingDay) {
      setEditingDay(existingDay);
      setFormData({
        date: existingDay.date,
        day_type: existingDay.day_type,
        is_paid: existingDay.is_paid,
        description: existingDay.description || "",
      });
    } else {
      setEditingDay(null);
      setFormData({
        date: format(clickedDate, "yyyy-MM-dd"),
        day_type: "REGULAR",
        is_paid: false,
        description: "",
      });
    }
    setDialogOpen(true);
  };

  // Event click handler - only if user can edit
  const handleEventClick = (info: any) => {
    if (!canEdit) return;

    const eventId = parseInt(info.event.id);
    const existingDay = calendarDays.find((day) => day.id === eventId);

    if (existingDay) {
      setEditingDay(existingDay);
      setFormData({
        date: existingDay.date,
        day_type: existingDay.day_type,
        is_paid: existingDay.is_paid,
        description: existingDay.description || "",
      });
      setDialogOpen(true);
    }
  };

  const getDayTypeShortLabel = (type: string) => {
    switch (type) {
      case "REGULAR_HOLIDAY":
        return "RH";
      case "SPECIAL_HOLIDAY":
        return "SH";
      case "SPECIAL_NON_WORKING":
        return "SNW";
      default:
        return "RD";
    }
  };

  const getDayTypeLabel = (type: string) => {
    switch (type) {
      case "REGULAR_HOLIDAY":
        return "Regular Holiday";
      case "SPECIAL_HOLIDAY":
        return "Special Holiday";
      case "SPECIAL_NON_WORKING":
        return "Special Non-Working";
      default:
        return "Regular Day";
    }
  };

  const handleSubmit = async () => {
    if (!canEdit) return;

    try {
      if (editingDay) {
        await updateCalendarDay(editingDay.id, {
          day_type: formData.day_type,
          is_paid: formData.is_paid,
          description: formData.description,
        });
        toast.success("Calendar day updated successfully");
      } else {
        await createCalendarDay(formData);
        toast.success("Calendar day created successfully");
      }

      if (selectedDate) {
        const start = format(startOfMonth(selectedDate), "yyyy-MM-dd");
        const end = format(endOfMonth(selectedDate), "yyyy-MM-dd");
        await fetchCalendarDays(start, end);
      }

      setDialogOpen(false);
      setEditingDay(null);
      setFormData({
        date: "",
        day_type: "REGULAR",
        is_paid: false,
        description: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to save calendar day");
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    if (!editingDay) return;

    try {
      await deleteCalendarDay(editingDay.id);
      toast.success("Calendar day deleted successfully");

      if (selectedDate) {
        const start = format(startOfMonth(selectedDate), "yyyy-MM-dd");
        const end = format(endOfMonth(selectedDate), "yyyy-MM-dd");
        await fetchCalendarDays(start, end);
      }

      setDialogOpen(false);
      setEditingDay(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete calendar day");
    }
  };

  const handlePrevMonth = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
      const newDate = calendarApi.getDate();
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    }
  };

  const handleNextMonth = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
      const newDate = calendarApi.getDate();
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
      const newDate = new Date();
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    }
  };

  // Handle date picker selection
  const handleDatePickerSelect = (date: Date | undefined) => {
    if (date && calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(date);
      setSelectedDate(date);
      setCurrentMonth(date);
      setDatePickerOpen(false);
      toast.info(`Jumped to ${format(date, "MMMM yyyy")}`);
    }
  };

  // Handle month/year navigation from date picker
  const handleMonthChange = (date: Date) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(date);
      setSelectedDate(date);
      setCurrentMonth(date);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canBulkUpload) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = () => {
    if (!canBulkUpload) return;
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canBulkUpload) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      const allowedTypes = [".xlsx", ".xls", ".csv"];
      const fileExt = "." + file.name.split(".").pop()?.toLowerCase();

      if (!allowedTypes.includes(fileExt)) {
        toast.error("Please upload Excel or CSV files only");
        return;
      }

      processFile(file);
    }
  };

  // Helper function to validate and normalize day type
  const normalizeDayType = (type: string): string | null => {
    if (!type) return null;

    const normalized = type
      .toString()
      .toUpperCase()
      .trim()
      .replace(/_/g, " ")
      .replace(/\s+/g, " ");

    const typeMap: { [key: string]: string } = {
      REGULAR: "REGULAR",
      RD: "REGULAR",
      "REGULAR DAY": "REGULAR",
      "SPECIAL NON WORKING": "SPECIAL_NON_WORKING",
      SNW: "SPECIAL_NON_WORKING",
      "REGULAR HOLIDAY": "REGULAR_HOLIDAY",
      RH: "REGULAR_HOLIDAY",
      "SPECIAL HOLIDAY": "SPECIAL_HOLIDAY",
      SH: "SPECIAL_HOLIDAY",
    };

    return typeMap[normalized] || null;
  };

  // Helper function to validate and normalize paid status
  const normalizePaidStatus = (value: any): boolean => {
    if (typeof value === "boolean") return value;
    const str = value?.toString().toLowerCase().trim();
    return ["yes", "y", "true", "paid", "1"].includes(str);
  };

  // Robust date parser - Handles any date format
  const parseExcelDate = (value: any): string | null => {
    try {
      let date: Date | null = null;

      if (typeof value === "number") {
        const excelEpoch = new Date(1900, 0, 1);
        date = new Date(excelEpoch.getTime() + (value - 2) * 86400000);
      } else if (typeof value === "string") {
        const str = value.trim();
        const mmddyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const iso = /^(\d{4})-(\d{2})-(\d{2})$/;

        if (mmddyyyy.test(str)) {
          const [, m, d, y] = str.match(mmddyyyy)!;
          date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        } else if (iso.test(str)) {
          const [, y, m, d] = str.match(iso)!;
          date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        } else {
          return null;
        }
      }

      if (!date || isNaN(date.getTime())) return null;

      return format(date, "yyyy-MM-dd");
    } catch {
      return null;
    }
  };

  // Process uploaded file
  const processFile = async (file: File) => {
    if (!canBulkUpload) return;

    setUploading(true);

    try {
      const data = await file.arrayBuffer();

      const workbook = XLSX.read(data);

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("File is empty");
        return;
      }

      if (jsonData.length > 1000) {
        toast.error("Maximum 1000 rows allowed per upload");
        return;
      }

      const processedData: any[] = [];
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        const rowNum = i + 2;

        const dateValue =
          row["Date"] || row["date"] || row["DATE"] || row["Day"] || row["day"];
        const typeValue =
          row["Type"] ||
          row["type"] ||
          row["Day Type"] ||
          row["day_type"] ||
          row["DAY_TYPE"];
        const paidValue =
          row["Paid"] ||
          row["paid"] ||
          row["Is Paid"] ||
          row["is_paid"] ||
          row["PAID"];
        const descValue =
          row["Description"] ||
          row["description"] ||
          row["Notes"] ||
          row["notes"];

        if (!dateValue) {
          const error = `Row ${rowNum}: Date is required`;
          errors.push(error);
          continue;
        }

        const date = parseExcelDate(dateValue);
        if (!date) {
          const error = `Row ${rowNum}: Invalid date format: "${dateValue}"`;
          errors.push(error);
          continue;
        }

        if (!typeValue) {
          const error = `Row ${rowNum}: Day type is required`;
          errors.push(error);
          continue;
        }

        const day_type = normalizeDayType(typeValue);
        if (!day_type) {
          const error = `Row ${rowNum}: Invalid day type "${typeValue}". Must be: Regular, Special Non-Working, Regular Holiday, Special Holiday`;
          errors.push(error);
          continue;
        }

        const is_paid =
          paidValue !== undefined ? normalizePaidStatus(paidValue) : false;

        let description = "";
        if (descValue) {
          description = descValue.toString().trim().substring(0, 500);
        }

        processedData.push({
          date,
          day_type,
          is_paid,
          description,
        });
      }

      if (processedData.length === 0) {
        toast.error("No valid data found in file");
        if (errors.length > 0) {
          toast.error(`Errors found: ${errors.slice(0, 3).join(", ")}`);
        }
        return;
      }

      const results = await bulkUploadCalendar(processedData, overwrite);

      setUploadResults(results);
      setShowResults(true);
      setBulkUploadOpen(false);

      if (selectedDate) {
        const start = format(startOfMonth(selectedDate), "yyyy-MM-dd");
        const end = format(endOfMonth(selectedDate), "yyyy-MM-dd");
        await fetchCalendarDays(start, end);
      }

      toast.success(
        `Upload completed: ${results.summary.inserted} inserted, ${results.summary.updated} updated`,
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to process file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canBulkUpload) return;
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [".xlsx", ".xls", ".csv"];
      const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        toast.error("Please upload Excel or CSV files only");
        return;
      }
      processFile(file);
    }
  };

  // Download template
  const downloadTemplate = () => {
    if (!canDownloadTemplate) return;

    const templateData = [
      {
        Date: "2026-01-25",
        Type: "REGULAR_HOLIDAY",
        Paid: true,
        Description: "Sample Holiday",
      },
      {
        Date: "1/25/2026",
        Type: "SPECIAL_NON_WORKING",
        Paid: false,
        Description: "Sample Special Day (MM/DD/YYYY format)",
      },
      {
        Date: "25/01/2026",
        Type: "REGULAR",
        Paid: true,
        Description: "Sample Regular Day (DD/MM/YYYY format)",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Calendar Template");

    const instructions = [
      {
        Column: "Date",
        Format: "Any valid date format",
        Required: "Yes",
        Description: "Supports: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.",
        Example: "1/25/2026 or 2026-01-25",
      },
      {
        Column: "Type",
        Format:
          "REGULAR | SPECIAL_NON_WORKING | REGULAR_HOLIDAY | SPECIAL_HOLIDAY",
        Required: "Yes",
        Description: "Day type classification",
        Example: "REGULAR_HOLIDAY",
      },
      {
        Column: "Paid",
        Format: "true/false, yes/no, 1/0",
        Required: "No",
        Description: "Whether the day is paid (default: false)",
        Example: "true",
      },
      {
        Column: "Description",
        Format: "Text",
        Required: "No",
        Description: "Optional description (max 500 chars)",
        Example: "Christmas Day",
      },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

    XLSX.writeFile(workbook, "calendar_template.xlsx");
    toast.success("Template downloaded");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarIcon className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            Calendar Management
          </h1>
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? "Manage holidays, special days, and working days for payroll calculations"
              : "View holidays, special days, and working days for payroll calculations"}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {canDownloadTemplate && (
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        )}
        {canBulkUpload && (
          <Button
            onClick={() => setBulkUploadOpen(true)}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
        )}
        {canEdit && (
          <Button
            onClick={() =>
              handleDateClick({ dateStr: format(new Date(), "yyyy-MM-dd") })
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Special Day
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <span>Calendar</span>
              </CardTitle>
              <div className="flex gap-2 items-center">
                {/* Date Picker Button */}
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {selectedDate
                          ? format(selectedDate, "MMMM yyyy")
                          : "Select Date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDatePickerSelect}
                      initialFocus
                      month={currentMonth}
                      onMonthChange={handleMonthChange}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>

                <Button variant="outline" size="sm" onClick={handleToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <style>{`
              .fc {
                --fc-border-color: #e5e7eb;
                --fc-button-bg-color: #ffffff;
                --fc-button-border-color: #e5e7eb;
                --fc-button-text-color: #374151;
                --fc-button-hover-bg-color: #f9fafb;
                --fc-button-hover-border-color: #d1d5db;
                --fc-button-active-bg-color: #f3f4f6;
                --fc-today-bg-color: #eff6ff;
                --fc-event-border-radius: 0.375rem;
                font-family: inherit;
              }

              .fc .fc-toolbar-title {
                font-size: 1.25rem;
                font-weight: 600;
                color: #111827;
              }

              .fc .fc-daygrid-day-frame {
                min-height: 100px;
                ${canEdit ? "cursor: pointer;" : "cursor: default;"}
              }

              .fc .fc-daygrid-day-frame:hover {
                ${canEdit ? "background-color: #f9fafb;" : ""}
              }

              .fc .fc-day-today {
                background-color: #eff6ff !important;
              }

              .fc .fc-event {
                ${canEdit ? "cursor: pointer;" : "cursor: default;"}
                transition: transform 0.2s;
              }

              .fc .fc-event:hover {
                ${canEdit ? "transform: scale(1.02);" : ""}
              }

              .fc .fc-daygrid-day-number {
                font-size: 0.875rem;
                font-weight: 500;
                color: #374151;
                padding: 0.25rem;
              }
            `}</style>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={false}
              events={events}
              dateClick={canEdit ? handleDateClick : undefined}
              eventClick={canEdit ? handleEventClick : undefined}
              height="auto"
              dayMaxEvents={2}
              displayEventTime={false}
              eventDisplay="block"
              eventBackgroundColor="#10b981"
              eventBorderColor="#10b981"
              eventTextColor="#ffffff"
              firstDay={0}
              loading={setLoading}
            />
          </CardContent>
        </Card>

        {/* Legend and Information */}
        <Card>
          <CardHeader>
            <CardTitle>Legend & Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-700">Day Types</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500"></div>
                  <span className="text-sm">Regular Day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-600"></div>
                  <span className="text-sm">Regular Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                  <span className="text-sm">Special Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span className="text-sm">Special Non-Working</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-700">
                Indicators
              </h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">💰</span>
                  <span className="text-sm">Paid Day</span>
                </div>
              </div>
            </div>

            {/* Actions / Information based on role */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-700">
                {canEdit ? "Actions" : "Information"}
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                {canEdit ? (
                  <>
                    <p>• Click on any date to add/edit</p>
                    <p>• Click on colored events to edit</p>
                    <p>• Hover over events for details</p>
                    <p>• Use date picker to jump to any month/year</p>
                    <p className="text-blue-600 mt-2">
                      Note: ADMIN and HR_ADMIN have full access
                    </p>
                  </>
                ) : (
                  <>
                    <p>• View calendar to see holidays and special days</p>
                    <p>• Hover over events for details</p>
                    <p>• Use date picker to jump to any month/year</p>
                    <p className="text-blue-600 mt-2">
                      Note: Calendar is read-only for employees
                    </p>
                  </>
                )}
              </div>
            </div>

            {selectedDate && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-sm text-gray-700 mb-2">
                  Selected Date: {format(selectedDate, "MMMM d, yyyy")}
                </h3>
                {(() => {
                  const dayData = calendarDays.find((day) =>
                    isSameDay(new Date(day.date), selectedDate),
                  );
                  if (dayData) {
                    return (
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Type:</span>{" "}
                          {getDayTypeLabel(dayData.day_type)}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          {dayData.is_paid ? "Paid" : "Unpaid"}
                        </p>
                        {dayData.description && (
                          <p>
                            <span className="font-medium">Description:</span>{" "}
                            {dayData.description}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <p className="text-sm text-gray-500">
                      {canEdit
                        ? "Click on any date to add or edit calendar information"
                        : "No special day configured for this date"}
                    </p>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog - Only for users who can edit */}
      {canEdit && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDay ? "Edit Calendar Day" : "Add Calendar Day"}
              </DialogTitle>
              <DialogDescription>
                {editingDay
                  ? "Modify the details for this calendar day"
                  : "Add a new holiday or special day to the calendar"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  {formData.date
                    ? format(new Date(formData.date), "MMMM d, yyyy")
                    : "Select a date"}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="day_type">Day Type</Label>
                <Select
                  value={formData.day_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, day_type: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR">Regular Day</SelectItem>
                    <SelectItem value="SPECIAL_NON_WORKING">
                      Special Non-Working Day
                    </SelectItem>
                    <SelectItem value="SPECIAL_HOLIDAY">
                      Special Holiday
                    </SelectItem>
                    <SelectItem value="REGULAR_HOLIDAY">
                      Regular Holiday
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_paid">Paid Day</Label>
                <Switch
                  id="is_paid"
                  checked={formData.is_paid}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_paid: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Independence Day, Christmas, etc."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              {editingDay && canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="mr-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit}>
                {editingDay ? (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Upload Dialog */}
      {canBulkUpload && (
        <>
          <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Upload Calendar Days</DialogTitle>
                <DialogDescription>
                  Upload an Excel or CSV file with your calendar data.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Download Template</Label>
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel Template
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
                      dragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      ref={fileInputRef}
                      disabled={uploading}
                    />
                    <label
                      htmlFor="file-upload"
                      className={`cursor-pointer block ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {dragging
                          ? "Drop your file here 👇"
                          : uploading
                            ? "Processing..."
                            : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Excel or CSV files only (max 1000 rows)
                      </p>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Overwrite existing data</Label>
                    <Switch
                      checked={overwrite}
                      onCheckedChange={setOverwrite}
                      disabled={uploading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    If enabled, existing dates will be updated. If disabled,
                    existing dates will be skipped.
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    File should have columns: Date, Type, Paid (optional),
                    Description (optional). Supports any date format.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setBulkUploadOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Upload Results Dialog */}
          <Dialog open={showResults} onOpenChange={setShowResults}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Upload Results</DialogTitle>
                <DialogDescription>
                  Here's what happened with your upload.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {uploadResults && (
                  <>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {uploadResults.summary.inserted}
                        </p>
                        <p className="text-xs text-gray-600">Inserted</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {uploadResults.summary.updated}
                        </p>
                        <p className="text-xs text-gray-600">Updated</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">
                          {uploadResults.summary.failed}
                        </p>
                        <p className="text-xs text-gray-600">Failed</p>
                      </div>
                    </div>

                    {uploadResults.errors &&
                      uploadResults.errors.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-red-600">Errors:</Label>
                          <div className="max-h-40 overflow-y-auto space-y-1 bg-red-50 p-3 rounded-lg">
                            {uploadResults.errors.map((error, i) => (
                              <p key={i} className="text-xs text-red-600">
                                • {error}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                    <p className="text-sm text-gray-600 text-center">
                      Total rows processed: {uploadResults.summary.totalRows}
                    </p>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button onClick={() => setShowResults(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default CalendarPage;
