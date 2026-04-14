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

const AdminLeavePage = () => {
  const [leaves, setLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState("requests");

  // Reject modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    const data = await leaveService.getAllLeaves();
    setLeaves(data);
  };

  const handleUpdate = async (id: number, status: string) => {
    if (status === "REJECTED") {
      // Open modal instead of directly rejecting
      setRejectId(id);
      setRejectReason("");
      setRejectModalOpen(true);
      return;
    }

    // For APPROVED, directly call API
    try {
      await leaveService.updateLeaveStatus(id, status);
      toast.success(`Leave ${status.toLowerCase()} successfully`);
      fetchLeaves();
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
      fetchLeaves();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject leave");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeTab === "requests") {
      fetchLeaves();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6 p-6">
      {/* Header - Matching consistent theme */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
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

        {/* LEAVE REQUESTS TAB - No extra Card wrapper */}
        <TabsContent value="requests" className="mt-6">
          <LeaveTable data={leaves} isAdmin={true} onUpdate={handleUpdate} />
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
