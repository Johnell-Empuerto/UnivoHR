import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getKpiTemplates } from "@/services/kpiService";

export const useKpiTemplatesList = (page: number, pageSize: number, search: string) => {
  return useQuery({
    queryKey: ["kpi-templates", page, pageSize, search],
    queryFn: () => getKpiTemplates(page, pageSize, search),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
