import { useQuery } from "@tanstack/react-query";
import { getMyPerformanceSummary } from "@/services/kpiService";

export const useMyPerformanceSummary = () => {
  return useQuery({
    queryKey: ["my-performance-summary"],
    queryFn: getMyPerformanceSummary,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
