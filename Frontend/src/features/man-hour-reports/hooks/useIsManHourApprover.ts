import { useQuery } from "@tanstack/react-query";
import { isApprover as checkIsApprover } from "@/services/manHourReportService";

export const useIsManHourApprover = (enabled: boolean) => {
  return useQuery({
    queryKey: ["is-man-hour-approver"],
    queryFn: async () => {
      const result = await checkIsApprover();
      return result.isApprover;
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
