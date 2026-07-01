import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { leaveService } from "@/services/leaveService";

export const useAdminLeaves = (
  page: number,
  limit: number,
  search: string,
  status: string,
  type: string,
) => {
  return useQuery({
    queryKey: ["admin-leaves", page, limit, search, status, type],
    queryFn: () => leaveService.getAllLeaves(page, limit, search, status, type),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
