import { useQuery } from "@tanstack/react-query";
import { getKpiTemplateItems } from "@/services/kpiService";

export const useKpiTemplateItems = (templateId: number | null) => {
  return useQuery({
    queryKey: ["kpi-template-items", templateId],
    queryFn: () => getKpiTemplateItems(templateId!),
    enabled: !!templateId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
