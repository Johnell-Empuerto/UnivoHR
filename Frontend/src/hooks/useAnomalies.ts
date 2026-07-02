import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAnomalies } from "@/services/anomalyService";

export const useAnomalies = (
  page: number,
  limit: number,
  status: string,
  severity: string,
  type: string,
  module: string,
  search: string,
) => {
  const normalizeFilter = (v: string) => (!v || v === "all" ? undefined : v);
  return useQuery({
    queryKey: ["anomalies", page, status, severity, type, module, search],
    queryFn: () =>
      getAnomalies({
        page,
        limit,
        status: normalizeFilter(status),
        severity: normalizeFilter(severity),
        anomaly_type: normalizeFilter(type),
        source_module: normalizeFilter(module),
        employee_id: search || undefined,
      }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};


