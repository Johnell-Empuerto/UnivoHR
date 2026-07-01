import { useQuery } from "@tanstack/react-query";
import { getAnomalyById } from "@/services/anomalyService";

export const useAnomalyDetail = (id: number | null, enabled: boolean) => {
  return useQuery({
    queryKey: ["anomaly", id],
    queryFn: () => getAnomalyById(id!),
    enabled: enabled && id !== null,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
