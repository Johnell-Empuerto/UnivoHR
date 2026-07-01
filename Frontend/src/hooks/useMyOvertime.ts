import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMyOvertime } from "@/services/overtimeService";

export const useMyOvertime = (
  page: number,
  limit: number,
  search: string,
  status: string,
) => {
  return useQuery({
    queryKey: ["my-overtime", page, limit, search, status],
    queryFn: () => getMyOvertime(page, limit, search, status),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
