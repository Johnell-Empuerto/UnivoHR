import { useQuery } from "@tanstack/react-query";
import { leaveService } from "@/services/leaveService";

export const useLeaveCredits = () => {
  return useQuery({
    queryKey: ["leave-credits"],
    queryFn: () => leaveService.getLeaveCredits(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
