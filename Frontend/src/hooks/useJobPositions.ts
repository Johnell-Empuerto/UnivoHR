import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getJobPositions } from "@/services/jobPositionService";

export const useJobPositions = (
  page: number,
  limit: number,
  search: string,
  status: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ["job-positions", page, limit, search, status],
    queryFn: () => getJobPositions(page, limit, search, status),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
