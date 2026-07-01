import { useQuery } from "@tanstack/react-query";
import { getKpiEvaluationById } from "@/services/kpiService";

export const useKpiEvaluationDetail = (id: number | null) => {
  return useQuery({
    queryKey: ["kpi-evaluation-detail", id],
    queryFn: () => getKpiEvaluationById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
