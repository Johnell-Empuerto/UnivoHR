import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMyKpiEvaluations } from "@/services/kpiService";

export const useMyKpiEvaluations = (status: string) => {
  return useQuery({
    queryKey: ["my-kpi-evaluations", status],
    queryFn: () => getMyKpiEvaluations(status),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
