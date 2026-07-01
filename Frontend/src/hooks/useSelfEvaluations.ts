import { useQuery } from "@tanstack/react-query";
import { getMyKpiEvaluations } from "@/services/kpiService";

export const useSelfEvaluations = () => {
  return useQuery({
    queryKey: ["kpi", "self-evaluations"],
    queryFn: () => getMyKpiEvaluations(""),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
