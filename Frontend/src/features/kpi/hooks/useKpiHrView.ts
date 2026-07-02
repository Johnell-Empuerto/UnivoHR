import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getKpiHrView } from "@/services/kpiService";

export const useKpiHrView = (search: string, status: string, page: number, pageSize: number) => {
  return useQuery({
    queryKey: ["kpi-hr-view", search, status, page, pageSize],
    queryFn: () => getKpiHrView(search, status, page, pageSize),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
