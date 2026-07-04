import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { usePayrollApprovals } from "../hooks/usePayrollApprovals";
import { reviewApprovalRequest } from "@/services/payrollApprovalService";
import { useActiveBranches } from "@/hooks/useBranches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loader from "@/components/shared/Loader";

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "PENDING":
      return "outline";
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    default:
      return "secondary";
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case "PENDING":
      return <Clock className="h-3 w-3" />;
    case "APPROVED":
      return <CheckCircle className="h-3 w-3" />;
    case "REJECTED":
      return <XCircle className="h-3 w-3" />;
    default:
      return null;
  }
};

const PayrollApprovalPanel = () => {
  const [branchFilter, setBranchFilter] = useState("");
  const [actionTarget, setActionTarget] = useState<{
    id: number;
    action: "APPROVED" | "REJECTED";
  } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: branches = [] } = useActiveBranches();
  const { data: approvals, isLoading } = usePayrollApprovals(
    branchFilter || undefined,
    "PENDING",
  );

  const handleReview = async () => {
    if (!actionTarget) return;

    try {
      setIsSubmitting(true);
      const payload: Record<string, unknown> = {
        status: actionTarget.action,
      };
      if (actionTarget.action === "REJECTED" && remarks.trim()) {
        payload.remarks = remarks.trim();
      }
      await reviewApprovalRequest(actionTarget.id, payload);
      toast.success(
        actionTarget.action === "APPROVED"
          ? "Approval request approved"
          : "Approval request rejected",
      );
      setActionTarget(null);
      setRemarks("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to review request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const list = Array.isArray(approvals) ? approvals : approvals?.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <div>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            Payroll Approval Requests
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and approve payroll submissions for the current cutoff
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Branch:</span>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b: { id: number; name: string }) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader message="Loading approval requests..." />
        ) : list.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>No pending approval requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {item.branch_name || `Branch #${item.branch_id}`}
                    </p>
                    <Badge variant={statusBadgeVariant(item.status)}>
                      {statusIcon(item.status)}
                      <span className="ml-1">{item.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submitted by {item.submitted_by_name || "Unknown"} &middot;{" "}
                    {item.cutoff_start} → {item.cutoff_end}
                  </p>
                  {item.remarks && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Remarks: {item.remarks}
                    </p>
                  )}
                </div>
                {item.status === "PENDING" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700"
                      onClick={() =>
                        setActionTarget({ id: item.id, action: "APPROVED" })
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setActionTarget({ id: item.id, action: "REJECTED" })
                      }
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={!!actionTarget}
        onOpenChange={(open) => {
          if (!open) {
            setActionTarget(null);
            setRemarks("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionTarget?.action === "APPROVED"
                ? "Approve Payroll Request"
                : "Reject Payroll Request"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget?.action === "APPROVED"
                ? "This will approve the payroll submission. Proceed?"
                : "Provide a reason for rejection below."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionTarget?.action === "REJECTED" && (
            <Textarea
              placeholder="Reason for rejection..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={handleReview}
              className={
                actionTarget?.action === "APPROVED"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : actionTarget?.action === "APPROVED" ? (
                "Yes, Approve"
              ) : (
                "Yes, Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PayrollApprovalPanel;
