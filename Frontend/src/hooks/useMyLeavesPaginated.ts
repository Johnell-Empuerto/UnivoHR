import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { leaveService } from "@/services/leaveService";

export const useMyLeavesPaginated = (page: number, limit: number) => {
  return useQuery({
    queryKey: ["my-leaves", page, limit],
    queryFn: () => leaveService.getMyLeaves(page, limit),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
