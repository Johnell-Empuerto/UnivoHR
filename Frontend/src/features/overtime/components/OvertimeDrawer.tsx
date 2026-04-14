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
import { CheckCircle, XCircle, Clock } from "lucide-react";

type OvertimeStatus = "PENDING" | "APPROVED" | "REJECTED";

type OvertimeRequest = {
  id: number;
  employee_name?: string;
  employee_code?: string;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  reason: string;
  status: OvertimeStatus;
  created_at: string;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejected_reason?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  request: OvertimeRequest | null;
};

const formatValue = (value: any) => value || "-";

const Info = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{formatValue(value)}</p>
  </div>
);

const getStatusBadge = (status: OvertimeStatus) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <Clock className="h-3 w-3 mr-1" />
          PENDING
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

const OvertimeDrawer = ({ open, onClose, request }: Props) => {
  if (!request) return null;

  return (
    <Drawer open={open} onOpenChange={onClose} direction="right">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Overtime Request Details</DrawerTitle>
          <DrawerDescription>
            View complete overtime request information
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[90vh]">
          {/* Header with Employee Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/40">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
              {request.employee_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-semibold">{request.employee_name || "N/A"}</p>
              <p className="text-xs text-muted-foreground">
                {request.employee_code || "N/A"}
              </p>
            </div>
          </div>

          {/* Request Information */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Request Information
            </p>
            <Info label="Date" value={formatDate(request.date)} />
            <Info label="Start Time" value={request.start_time} />
            <Info label="End Time" value={request.end_time} />
            <Info label="Total Hours" value={`${request.hours} hours`} />
            <div>
              <p className="text-xs text-muted-foreground">Reason</p>
              <p className="text-sm mt-1 p-3 bg-muted/30 rounded-md whitespace-pre-wrap wrap-break-word">
                {request.reason}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(request.status)}</div>
            </div>
          </div>

          {/* Approval Information */}
          {(request.status === "APPROVED" || request.status === "REJECTED") && (
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Approval Information
              </p>
              {request.status === "APPROVED" && (
                <>
                  <Info
                    label="Approved By"
                    value={request.approved_by_name || "System"}
                  />
                  <Info
                    label="Approved At"
                    value={
                      request.approved_at
                        ? formatDateTime(request.approved_at)
                        : "-"
                    }
                  />
                </>
              )}
              {request.status === "REJECTED" && (
                <>
                  <Info
                    label="Rejection Reason"
                    value={request.rejected_reason || "No reason provided"}
                  />
                </>
              )}
            </div>
          )}

          {/* Submission Information */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Submission Information
            </p>
            <Info
              label="Submitted At"
              value={formatDateTime(request.created_at)}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default OvertimeDrawer;
