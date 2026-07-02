import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getKpiHistory } from "@/services/kpiService";

export const useKpiHistory = (page: number, pageSize: number, search: string) => {
  return useQuery({
    queryKey: ["kpi-history", page, pageSize, search],
    queryFn: () => getKpiHistory(undefined, page, pageSize, search),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
