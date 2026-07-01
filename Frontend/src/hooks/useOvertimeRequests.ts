import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAllOvertime, isApprover } from "@/services/overtimeService";

export const useOvertimeRequests = (
  page: number,
  limit: number,
  search: string,
  status: string,
  date: string,
) => {
  return useQuery({
    queryKey: ["overtime-requests", page, limit, search, status, date],
    queryFn: async () => {
      const res = await getAllOvertime(page, limit, search, status, date);
      return {
        data: res.data.map((request: any) => ({
          ...request,
          is_assigned_approver: request.is_assigned_approver ?? false,
        })),
        pagination: res.pagination,
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useIsOvertimeApprover = () => {
  return useQuery({
    queryKey: ["overtime-is-approver"],
    queryFn: async () => {
      const res = await isApprover();
      return res.isApprover;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
