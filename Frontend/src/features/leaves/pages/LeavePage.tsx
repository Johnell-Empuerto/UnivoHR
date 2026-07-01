"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMyLeavesPaginated } from "@/hooks/useMyLeavesPaginated";
import { useAdminLeaves } from "@/hooks/useAdminLeaves";
import { useIsOvertimeApprover } from "@/hooks/useOvertimeRequests";
import { useAuth } from "@/app/providers/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeaveTable from "../components/LeaveTable";
import CreditLeaveTable from "../components/CreditLeaveTable";
import EmployeeCreditsTable from "../components/EmployeeCreditsTable";
import { leaveService } from "@/services/leaveService";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import Loader from "@/components/shared/Loader";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const LeavePage = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const isHR = hasPermission("leave.manage");
  const { data: isLeaveApprover = false } = useIsOvertimeApprover();
  const canManageCredits = hasPermission("leave.credits.manage");

  const [myLeavesPagination, setMyLeavesPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [allLeavesPagination, setAllLeavesPagination] =
    useState<PaginationData>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: myLeavesQuery, isFetching: myLeavesFetching } = useMyLeavesPaginated(
    myLeavesPagination.page, myLeavesPagination.limit,
  );
  const { data: allLeavesQuery, isFetching: allLeavesFetching } = useAdminLeaves(
    allLeavesPagination.page, allLeavesPagination.limit, search, statusFilter, typeFilter,
  );

  const myLeaves = myLeavesQuery?.data ?? [];
  const allLeaves = allLeavesQuery?.data ?? [];

  useEffect(() => {
    if (myLeavesQuery?.pagination) {
      setMyLeavesPagination(myLeavesQuery.pagination);
    }
  }, [myLeavesQuery]);

  useEffect(() => {
    if (allLeavesQuery?.pagination) {
      setAllLeavesPagination(allLeavesQuery.pagination);
    }
  }, [allLeavesQuery]);

  const handleUpdate = async (
    id: number,
    status: string,
    rejectionReason?: string,
  ) => {
    try {
      await leaveService.updateLeaveStatus(id, status, rejectionReason);
      toast.success(`Leave ${status.toLowerCase()} successfully`);

      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leaves"] });
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
    queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
    queryClient.invalidateQueries({ queryKey: ["admin-leaves"] });
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

  if (!user) {
    return <Loader message="Loading..." fullPage />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            {canManageAllLeaves() ? "Leave Management" : "My Leaves"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {canManageAllLeaves()
              ? "Review, approve, and manage all employee leave requests."
              : "Request leave, track your applications, and view your leave balance."}
          </p>
        </div>
      </div>

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
            onUpdate={handleUpdate}
            onCreate={handleRefresh}
            title="My Leave Requests"
            pagination={myLeavesPagination}
            onPageChange={handleMyLeavesPageChange}
            onLimitChange={handleMyLeavesLimitChange}
            loading={myLeavesFetching && myLeaves.length === 0}
          />
        </TabsContent>

        {canManageAllLeaves() && (
          <TabsContent value="all" className="mt-6">
            <LeaveTable
              data={allLeaves}
              onUpdate={handleUpdate}
              title="All Employee Leave Requests"
              pagination={allLeavesPagination}
              onPageChange={handleAllLeavesPageChange}
              onLimitChange={handleAllLeavesLimitChange}
              onSearch={setSearch}
              onStatusFilter={setStatusFilter}
              onTypeFilter={setTypeFilter}
              loading={allLeavesFetching && allLeaves.length === 0}
            />
          </TabsContent>
        )}

        <TabsContent value="credits" className="mt-6">
          {canManageCredits ? <EmployeeCreditsTable /> : <CreditLeaveTable />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeavePage;
