import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getJobPositions } from "@/services/jobPositionService";

export const useJobPositionsList = (
  page: number,
  pageSize: number,
  search: string,
  status: string,
) => {
  return useQuery({
    queryKey: ["job-positions", page, pageSize, search, status],
    queryFn: () => getJobPositions(page, pageSize, search, status),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
