import { useQuery } from "@tanstack/react-query";
import { getAnomalyTrend } from "@/services/analyticsService";

export const useAnomalyTrend = (days: number) => {
  return useQuery({
    queryKey: ["anomaly-trend", days],
    queryFn: () => getAnomalyTrend(days),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
