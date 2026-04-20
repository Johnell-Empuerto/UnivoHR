"use client";

import { useEffect, useState } from "react";
import { leaveService } from "@/services/leaveService";
import LeaveTable from "../components/LeaveTable";
import LeaveConversionSettings from "../components/LeaveConversionSettings";
import LeaveConversionHistory from "../components/LeaveConversionHistory";
import { CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Leave = {
  id: number;
  employee_name: string;
  employee_code?: string;
  type: string;
  from_date?: string;
  to_date?: string;
  status: string;
  day_fraction?: number;
  half_day_type?: "MORNING" | "AFTERNOON" | null;
};

const AdminLeavePage = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("requests");

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Reject modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const data = await leaveService.getAllLeaves(
        pagination.page,
        pagination.limit,
        search,
        statusFilter,
        typeFilter,
      );
      setLeaves(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when dependencies change
  useEffect(() => {
    if (activeTab === "requests") {
      fetchLeaves();
    }
  }, [
    activeTab,
    pagination.page,
    pagination.limit,
    search,
    statusFilter,
    typeFilter,
  ]);

  const handleUpdate = async (id: number, status: string) => {
    if (status === "REJECTED") {
      setRejectId(id);
      setRejectReason("");
      setRejectModalOpen(true);
      return;
    }

    try {
      await leaveService.updateLeaveStatus(id, status);
      toast.success(`Leave ${status.toLowerCase()} successfully`);
      fetchLeaves(); // Refresh with current pagination
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    if (!rejectId) return;

    try {
      setSubmitting(true);
      await leaveService.updateLeaveStatus(rejectId, "REJECTED", rejectReason);
      toast.success("Leave rejected successfully");
      setRejectModalOpen(false);
      setRejectReason("");
      setRejectId(null);
      fetchLeaves(); // Refresh with current pagination
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject leave");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination({ page: 1, limit, total: 0, totalPages: 1 });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            Leave Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Review, approve, and manage employee leave requests, conversion
            history, and settings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full max-w-md gap-2">
          <TabsTrigger
            value="requests"
            className="flex items-center gap-2 flex-1"
          >
            Leave Requests
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center gap-2 flex-1"
          >
            Conversion History
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center gap-2 flex-1"
          >
            Conversion Settings
          </TabsTrigger>
        </TabsList>

        {/* LEAVE REQUESTS TAB */}
        <TabsContent value="requests" className="mt-6">
          <LeaveTable
            data={leaves}
            isAdmin={true}
            onUpdate={handleUpdate}
            title="All Leave Requests"
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onSearch={setSearch}
            onStatusFilter={setStatusFilter}
            onTypeFilter={setTypeFilter}
            loading={loading}
          />
        </TabsContent>

        {/* CONVERSION HISTORY TAB */}
        <TabsContent value="history" className="mt-6">
          <LeaveConversionHistory />
        </TabsContent>

        {/* CONVERSION SETTINGS TAB */}
        <TabsContent value="settings" className="mt-6">
          <LeaveConversionSettings />
        </TabsContent>
      </Tabs>

      {/* Reject Reason Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request. This
              will be visible to the employee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason" className="text-sm font-medium">
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be shown to the employee.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectReason("");
                setRejectId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={submitting}
            >
              {submitting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeavePage;
