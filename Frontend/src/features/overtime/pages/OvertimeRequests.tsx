import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  approveOvertime,
  rejectOvertime,
  getOvertimeDetails,
  deleteOvertime,
} from "@/services/overtimeService";
import { useOvertimeRequests, useIsOvertimeApprover } from "@/hooks/useOvertimeRequests";
import ErrorMessage from "@/components/shared/ErrorMessage";
import Loader from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, RefreshCw, ClipboardList } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import OvertimeTable from "../components/OvertimeTable";
import OvertimeDrawer from "../components/OvertimeDrawer";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/app/providers/AuthProvider";

type OvertimeRequest = {
  id: number;
  employee_name?: string;
  employee_code?: string;
  employee_id?: number;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejected_by_name?: string | null;
  rejected_at?: string | null;
  rejected_reason?: string | null;
  is_assigned_approver?: boolean;
};

const OvertimeRequests = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: queryData, isFetching, error: queryError } = useOvertimeRequests(
    currentPage, rowsPerPage, search, statusFilter, dateFilter,
  );
  const { data: isUserApprover = false } = useIsOvertimeApprover();

  const data = queryData?.data ?? [];
  const totalPages = queryData?.pagination?.totalPages ?? 1;
  const totalRecords = queryData?.pagination?.total ?? 0;
  const loading = isFetching && data.length === 0;
  const error = queryError ? (queryError as any)?.message || "Failed to fetch overtime requests" : "";

  const handleDelete = async (id: number) => {
    try {
      await deleteOvertime(id);
      toast.success("Overtime request deleted");
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["overtime-requests"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete overtime request");
    }
  };

  const canUserApprove = (request: OvertimeRequest) => {
    if (hasPermission("overtime.approve")) {
      return true;
    }

    if (user?.role === "EMPLOYEE" && isUserApprover) {
      return request.is_assigned_approver === true;
    }

    return false;
  };

  const canShowApprovalActions = () => {
    return (
      hasPermission("overtime.approve") ||
      isUserApprover
    );
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setDateFilter("");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setDateFilter("");
  };

  const handleView = async (request: OvertimeRequest) => {
    try {
      const details = await getOvertimeDetails(request.id);
      setSelectedRequest(details);
      setIsDrawerOpen(true);
    } catch (err: any) {
      toast.error("Failed to load request details");
    }
  };

  const handleApprove = async (id: number) => {
    const request = data.find((r: any) => r.id === id);
    if (!canUserApprove(request!)) {
      toast.error("You don't have permission to approve this request");
      return;
    }

    try {
      setProcessing(true);
      await approveOvertime(id);
      toast.success("Overtime request approved");
      queryClient.invalidateQueries({ queryKey: ["overtime-requests"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to approve request");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    const request = data.find((r: any) => r.id === rejectingId);
    if (!canUserApprove(request!)) {
      toast.error("You don't have permission to reject this request");
      return;
    }

    try {
      setProcessing(true);
      await rejectOvertime(rejectingId, { reason: rejectReason });
      toast.success("Overtime request rejected");
      setIsRejectModalOpen(false);
      setRejectReason("");
      setRejectingId(null);
      queryClient.invalidateQueries({ queryKey: ["overtime-requests"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to reject request");
    } finally {
      setProcessing(false);
    }
  };

  if (error) return <ErrorMessage title="Error" message={error} />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            Overtime Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and manage employee overtime requests
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name or code..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Filter by date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            />

            {(searchInput || statusFilter || dateFilter) && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}

            <Button onClick={handleRefresh} variant="ghost">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <Loader message="Loading overtime requests..." />}

      <OvertimeTable
        data={data}
        onView={handleView}
        onApprove={handleApprove}
        onReject={(id) => {
          setRejectingId(id);
          setIsRejectModalOpen(true);
        }}
        onDelete={(id) => setDeleteConfirm(id)}
        canApprove={canShowApprovalActions()}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        rowsPerPage={rowsPerPage}
        title="All Overtime Requests"
      />

      <OvertimeDrawer
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete Overtime Request</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this overtime request?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-lg! w-full sm:max-w-lg!">
          <DialogHeader>
            <DialogTitle>Reject Overtime Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason("");
                  setRejectingId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing}
              >
                {processing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OvertimeRequests;
