"use client";

import { CheckCircle, XCircle, Clock } from "lucide-react";

type ApprovalTimelineProps = {
  request: {
    status: string;
    approved_by_name?: string | null;
    approved_at?: string | null;
    rejected_reason?: string | null;
    created_at: string;
  };
};

const ApprovalTimeline = ({ request }: ApprovalTimelineProps) => {
  const isApproved = request.status === "APPROVED";
  const isRejected = request.status === "REJECTED";

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h3 className="font-semibold">Approval Timeline</h3>
      <div className="space-y-3">
        {/* Submitted Step */}
        <div className="flex gap-3">
          <div className="shrink-0">
            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div>
            <p className="font-medium text-sm">Request Submitted</p>
            <p className="text-xs text-muted-foreground">
              {new Date(request.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Approval Step */}
        <div className="flex gap-3">
          <div className="shrink-0">
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center ${
                isApproved
                  ? "bg-green-100"
                  : isRejected
                    ? "bg-red-100"
                    : "bg-gray-100"
              }`}
            >
              {isApproved ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : isRejected ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Clock className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </div>
          <div>
            <p className="font-medium text-sm">
              {isApproved
                ? "Approved"
                : isRejected
                  ? "Rejected"
                  : "Pending Approval"}
            </p>
            {isApproved && request.approved_by_name && (
              <>
                <p className="text-xs text-muted-foreground">
                  By: {request.approved_by_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {request.approved_at
                    ? new Date(request.approved_at).toLocaleString()
                    : ""}
                </p>
              </>
            )}
            {isRejected && request.rejected_reason && (
              <>
                <p className="text-xs text-red-600">
                  Reason: {request.rejected_reason}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalTimeline;
