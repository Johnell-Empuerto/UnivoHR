import { useQuery } from "@tanstack/react-query";
import { getActiveKpiTemplates } from "@/services/kpiService";

export const useKpiActiveTemplates = () => {
  return useQuery({
    queryKey: ["kpi-active-templates"],
    queryFn: getActiveKpiTemplates,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
