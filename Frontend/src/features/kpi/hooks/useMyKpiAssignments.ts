import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMyKpiAssignments } from "@/services/kpiService";

export const useMyKpiAssignments = (status: string, page: number, pageSize: number) => {
  return useQuery({
    queryKey: ["my-kpi-assignments", status, page, pageSize],
    queryFn: () => getMyKpiAssignments(status, page, pageSize),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
