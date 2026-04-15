"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { formatDate, formatDateTime, formatTime } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ListChecks,
} from "lucide-react";

type ReportStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

type ManHourDetail = {
  id: number;
  time_from: string;
  time_to: string;
  activity: string;
  created_at?: string;
  updated_at?: string;
};

type ManHourReport = {
  id: number;
  employee_name?: string;
  employee_code?: string;
  employee_id?: number;
  work_date: string;
  task: string;
  hours: number;
  remarks?: string | null;
  created_at: string;
  updated_at?: string;
  details?: ManHourDetail[];
  timeline?: {
    request_type: string;
    action: string;
    remarks: string | null;
    created_at: string;
    performed_by: string;
  }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  report: ManHourReport | null;
};

const formatValue = (value: any) => value || "-";

const Info = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{formatValue(value)}</p>
  </div>
);

const getStatusBadge = (status: ReportStatus) => {
  switch (status) {
    case "SUBMITTED":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400"
        >
          <FileText className="h-3 w-3 mr-1" />
          SUBMITTED
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          APPROVED
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400"
        >
          <XCircle className="h-3 w-3 mr-1" />
          REJECTED
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Calculate duration between two times
const calculateDuration = (timeFrom: string, timeTo: string): string => {
  const [fromHour, fromMin] = timeFrom.split(":").map(Number);
  const [toHour, toMin] = timeTo.split(":").map(Number);
  const fromMinutes = fromHour * 60 + fromMin;
  const toMinutes = toHour * 60 + toMin;
  const diffMinutes = toMinutes - fromMinutes;

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
};

const ManHourReportDrawer = ({ open, onClose, report }: Props) => {
  if (!report) return null;

  const status =
    report.timeline && report.timeline.length > 0
      ? (report.timeline[report.timeline.length - 1].action as ReportStatus)
      : "SUBMITTED";

  // Calculate total hours from details if available
  const totalHoursFromDetails =
    report.details?.reduce((total, detail) => {
      const [fromHour, fromMin] = detail.time_from.split(":").map(Number);
      const [toHour, toMin] = detail.time_to.split(":").map(Number);
      const fromMinutes = fromHour * 60 + fromMin;
      const toMinutes = toHour * 60 + toMin;
      return total + (toMinutes - fromMinutes);
    }, 0) || 0;

  const displayHours =
    totalHoursFromDetails > 0
      ? `${Math.floor(totalHoursFromDetails / 60)} hr ${totalHoursFromDetails % 60} min`
      : `${report.hours} hours`;

  return (
    <Drawer open={open} onOpenChange={onClose} direction="right">
      <DrawerContent className="w-full sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Man Hour Report Details
          </DrawerTitle>
          <DrawerDescription>
            View complete man hour report information including time entries and
            approval history
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Header with Employee Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/40">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {report.employee_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">
                {report.employee_name || "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">
                Employee Code: {report.employee_code || "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">
                Employee ID: {report.employee_id || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{displayHours}</div>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
          </div>

          {/* Report Information */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Report Information
              </p>
            </div>

            <Info label="Work Date" value={formatDate(report.work_date)} />
            <Info label="Status" value={getStatusBadge(status)} />

            {/* Time Entries Section - NEW & IMPROVED */}
            {report.details && report.details.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    Time Entries ({report.details.length})
                  </p>
                </div>
                <div className="space-y-3">
                  {report.details.map((detail) => (
                    <div
                      key={detail.id}
                      className="p-3 bg-muted/30 rounded-lg border-l-4 border-l-primary"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-semibold">
                            {formatTime(`1970-01-01T${detail.time_from}`)} -{" "}
                            {formatTime(`1970-01-01T${detail.time_to}`)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {calculateDuration(detail.time_from, detail.time_to)}
                        </Badge>
                      </div>
                      <p className="text-sm ml-5">{detail.activity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legacy single task display (if no details) */}
            {(!report.details || report.details.length === 0) && (
              <div>
                <p className="text-xs text-muted-foreground">Task</p>
                <p className="text-sm mt-1 p-2 bg-muted/30 rounded-md whitespace-pre-wrap">
                  {report.task}
                </p>
              </div>
            )}

            {report.remarks && (
              <div>
                <p className="text-xs text-muted-foreground">Remarks</p>
                <p className="text-sm mt-1 p-2 bg-muted/30 rounded-md whitespace-pre-wrap">
                  {report.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Approval Timeline */}
          {report.timeline && report.timeline.length > 0 && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Approval Timeline
                </p>
              </div>
              <div className="space-y-3">
                {report.timeline.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-md bg-muted/30"
                  >
                    {event.action === "APPROVED" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    ) : event.action === "REJECTED" ? (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {event.action === "APPROVED"
                          ? "Approved"
                          : event.action === "REJECTED"
                            ? "Rejected"
                            : "Submitted"}
                      </p>
                      {event.remarks && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.remarks}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        by {event.performed_by || "System"} •{" "}
                        {formatDateTime(event.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Information */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Submission Information
              </p>
            </div>
            <Info
              label="Submitted At"
              value={formatDateTime(report.created_at)}
            />
            {report.updated_at && report.updated_at !== report.created_at && (
              <Info
                label="Last Updated"
                value={formatDateTime(report.updated_at)}
              />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ManHourReportDrawer;
