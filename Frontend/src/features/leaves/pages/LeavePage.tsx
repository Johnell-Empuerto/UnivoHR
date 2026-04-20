"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeaveTable from "../components/LeaveTable";
import CreditLeaveTable from "../components/CreditLeaveTable";
import { leaveService } from "@/services/leaveService";
import { toast } from "sonner";
import { CalendarDays, Loader2 } from "lucide-react";
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

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const LeavePage = () => {
  const { user } = useAuth();
  const [isLeaveApprover, setIsLeaveApprover] = useState(false);
  const [loading, setLoading] = useState(true);

  const isHR = ["ADMIN", "HR_ADMIN", "HR"].includes(user?.role ?? "");

  // My Leaves State
  const [myLeaves, setMyLeaves] = useState<Leave[]>([]);
  const [myLeavesPagination, setMyLeavesPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [myLeavesLoading, setMyLeavesLoading] = useState(false);

  // All Leaves State (for admin/approvers)
  const [allLeaves, setAllLeaves] = useState<Leave[]>([]);
  const [allLeavesPagination, setAllLeavesPagination] =
    useState<PaginationData>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    });
  const [allLeavesLoading, setAllLeavesLoading] = useState(false);

  // Filter states for all leaves
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchMyLeaves = async (page: number, limit: number) => {
    if (!user) return;

    try {
      setMyLeavesLoading(true);
      const response = await leaveService.getMyLeaves(page, limit);
      setMyLeaves(response.data);
      setMyLeavesPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch my leaves:", error);
    } finally {
      setMyLeavesLoading(false);
    }
  };

  const fetchAllLeaves = async (
    page: number,
    limit: number,
    searchTerm: string,
    status: string,
    type: string,
  ) => {
    if (!(isHR || isLeaveApprover)) return;

    try {
      setAllLeavesLoading(true);
      const response = await leaveService.getAllLeaves(
        page,
        limit,
        searchTerm,
        status,
        type,
      );
      setAllLeaves(response.data);
      setAllLeavesPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch all leaves:", error);
    } finally {
      setAllLeavesLoading(false);
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

  // Fetch my leaves when component mounts or pagination changes
  useEffect(() => {
    fetchMyLeaves(myLeavesPagination.page, myLeavesPagination.limit);
  }, [user, myLeavesPagination.page, myLeavesPagination.limit]);

  // Fetch all leaves when filters or pagination change
  useEffect(() => {
    if (isHR || isLeaveApprover) {
      fetchAllLeaves(
        allLeavesPagination.page,
        allLeavesPagination.limit,
        search,
        statusFilter,
        typeFilter,
      );
    }
  }, [
    isHR,
    isLeaveApprover,
    allLeavesPagination.page,
    allLeavesPagination.limit,
    search,
    statusFilter,
    typeFilter,
  ]);

  // Initial loading state
  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  const handleUpdate = async (
    id: number,
    status: string,
    rejectionReason?: string,
  ) => {
    try {
      await leaveService.updateLeaveStatus(id, status, rejectionReason);
      toast.success(`Leave ${status.toLowerCase()} successfully`);

      // Refresh both lists
      fetchMyLeaves(myLeavesPagination.page, myLeavesPagination.limit);
      if (isHR || isLeaveApprover) {
        fetchAllLeaves(
          allLeavesPagination.page,
          allLeavesPagination.limit,
          search,
          statusFilter,
          typeFilter,
        );
      }
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
    fetchMyLeaves(myLeavesPagination.page, myLeavesPagination.limit);
    if (isHR || isLeaveApprover) {
      fetchAllLeaves(
        allLeavesPagination.page,
        allLeavesPagination.limit,
        search,
        statusFilter,
        typeFilter,
      );
    }
  };

  const handleMyLeavesPageChange = (page: number) => {
    setMyLeavesPagination((prev) => ({ ...prev, page }));
  };

  const handleMyLeavesLimitChange = (limit: number) => {
    setMyLeavesPagination({ page: 1, limit, total: 0, totalPages: 1 });
  };

  const handleAllLeavesPageChange = (page: number) => {
    setAllLeavesPagination((prev) => ({ ...prev, page }));
  };

  const handleAllLeavesLimitChange = (limit: number) => {
    setAllLeavesPagination({ page: 1, limit, total: 0, totalPages: 1 });
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
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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

      {/* Tabs */}
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
            pagination={myLeavesPagination}
            onPageChange={handleMyLeavesPageChange}
            onLimitChange={handleMyLeavesLimitChange}
            loading={myLeavesLoading}
          />
        </TabsContent>

        {canManageAllLeaves() && (
          <TabsContent value="all" className="mt-6">
            <LeaveTable
              data={allLeaves}
              isAdmin={true}
              onUpdate={handleUpdate}
              title="All Employee Leave Requests"
              pagination={allLeavesPagination}
              onPageChange={handleAllLeavesPageChange}
              onLimitChange={handleAllLeavesLimitChange}
              onSearch={setSearch}
              onStatusFilter={setStatusFilter}
              onTypeFilter={setTypeFilter}
              loading={allLeavesLoading}
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
