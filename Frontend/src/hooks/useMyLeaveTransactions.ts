import { useQuery } from "@tanstack/react-query";
import { leaveService } from "@/services/leaveService";

export const useMyLeaveTransactions = () => {
  return useQuery({
    queryKey: ["leave-transactions", "my"],
    queryFn: () => leaveService.getMyLeaves(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
