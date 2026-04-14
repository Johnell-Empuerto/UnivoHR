"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeaveTable from "../components/LeaveTable";
import CreditLeaveTable from "../components/CreditLeaveTable";
import { leaveService } from "@/services/leaveService";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import { isApprover as checkIsApprover } from "@/services/overtimeService";

type Leave = {
  id: number;
  employee_name: string;
  employee_code?: string;
  employee_id?: number;
  type: string;
  from_date?: string;
  to_date?: string;
  reason?: string;
  status: string;
};

const LeavePage = () => {
  const { user } = useAuth();
  const [isLeaveApprover, setIsLeaveApprover] = useState(false);
  const [loading, setLoading] = useState(true);

  const isHR = ["ADMIN", "HR_ADMIN", "HR"].includes(user?.role ?? "");

  const [myLeaves, setMyLeaves] = useState<Leave[]>([]);
  const [allLeaves, setAllLeaves] = useState<Leave[]>([]);

  const fetchLeaves = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const myData = await leaveService.getMyLeaves();
      setMyLeaves(myData);

      if (isHR || isLeaveApprover) {
        const allData = await leaveService.getAllLeaves();
        setAllLeaves(allData);
      }
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkApproverStatus = async () => {
      if (user?.id) {
        try {
          const result = await checkIsApprover();
          setIsLeaveApprover(result.isApprover);
        } catch (error) {
          setIsLeaveApprover(false);
        }
      }
    };
    checkApproverStatus();
  }, [user]);

  useEffect(() => {
    fetchLeaves();
  }, [user, isLeaveApprover]);

  const handleUpdate = async (id: number, status: string) => {
    try {
      await leaveService.updateLeaveStatus(id, status);
      toast.success(`Leave ${status.toLowerCase()} successfully`);
      fetchLeaves();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Something went wrong";
      if (message.includes("cannot approve your own leave")) {
        toast.error("You cannot approve your own leave.");
      } else {
        toast.error(message);
      }
    }
  };

  const handleRefresh = () => {
    fetchLeaves();
  };

  const canManageAllLeaves = () => {
    return isHR || isLeaveApprover;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {canManageAllLeaves() ? "Leave Management" : "My Leaves"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {canManageAllLeaves()
                ? "Review, approve, and manage all employee leave requests."
                : "Request leave, track your applications, and view your leave balance."}
            </p>
          </div>
        </div>
        <div className="flex justify-center py-12">Loading leaves...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {canManageAllLeaves() ? "Leave Management" : "My Leaves"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {canManageAllLeaves()
              ? "Review, approve, and manage all employee leave requests."
              : "Request leave, track your applications, and view your leave balance."}
          </p>
        </div>
      </div>

      {/* Tabs - LeaveTable already has its own Card */}
      <Tabs defaultValue="my" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 sm:grid-cols-3">
          <TabsTrigger value="my">My Leaves</TabsTrigger>
          {canManageAllLeaves() && (
            <TabsTrigger value="all">All Leaves</TabsTrigger>
          )}
          <TabsTrigger value="credits">Leave Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-6">
          <LeaveTable
            data={myLeaves}
            isAdmin={false}
            onUpdate={handleUpdate}
            onCreate={handleRefresh}
            title="My Leave Requests"
          />
        </TabsContent>

        {canManageAllLeaves() && (
          <TabsContent value="all" className="mt-6">
            <LeaveTable
              data={allLeaves}
              isAdmin={true}
              onUpdate={handleUpdate}
              title="All Employee Leave Requests"
            />
          </TabsContent>
        )}

        <TabsContent value="credits" className="mt-6">
          <CreditLeaveTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeavePage;
