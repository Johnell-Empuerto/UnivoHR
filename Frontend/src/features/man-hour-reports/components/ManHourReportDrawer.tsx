"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { formatDate, formatDateTime } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";

type ReportStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

type ManHourReport = {
  id: number;
  employee_name?: string;
  employee_code?: string;
  work_date: string;
  task: string;
  hours: number;
  remarks?: string | null;
  created_at: string;
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
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <FileText className="h-3 w-3 mr-1" />
          SUBMITTED
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          APPROVED
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="h-3 w-3 mr-1" />
          REJECTED
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const ManHourReportDrawer = ({ open, onClose, report }: Props) => {
  if (!report) return null;

  const status =
    report.timeline && report.timeline.length > 0
      ? (report.timeline[report.timeline.length - 1].action as ReportStatus)
      : "SUBMITTED";

  return (
    <Drawer open={open} onOpenChange={onClose} direction="right">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Man Hour Report Details</DrawerTitle>
          <DrawerDescription>
            View complete man hour report information
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[90vh]">
          {/* Header with Employee Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/40">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
              {report.employee_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-semibold">{report.employee_name || "N/A"}</p>
              <p className="text-xs text-muted-foreground">
                {report.employee_code || "N/A"}
              </p>
            </div>
          </div>

          {/* Report Information */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Report Information
            </p>
            <Info label="Work Date" value={formatDate(report.work_date)} />
            <Info label="Hours Worked" value={`${report.hours} hours`} />
            <div>
              <p className="text-xs text-muted-foreground">Task</p>
              <p className="text-sm mt-1 p-3 bg-muted/30 rounded-md whitespace-pre-wrap wrap-break-word">
                {report.task}
              </p>
            </div>
            {report.remarks && (
              <div>
                <p className="text-xs text-muted-foreground">Remarks</p>
                <p className="text-sm mt-1 p-3 bg-muted/30 rounded-md whitespace-pre-wrap wrap-break-word">
                  {report.remarks}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(status)}</div>
            </div>
          </div>

          {/* Timeline */}
          {report.timeline && report.timeline.length > 0 && (
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Approval Timeline
              </p>
              <div className="space-y-3">
                {report.timeline.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-md bg-muted/30"
                  >
                    {event.action === "APPROVED" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : event.action === "REJECTED" ? (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
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
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Submission Information
            </p>
            <Info
              label="Submitted At"
              value={formatDateTime(report.created_at)}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ManHourReportDrawer;
