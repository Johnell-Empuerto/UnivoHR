import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getApprovers } from "@/services/approverService";

export const useApprovers = (
  page: number,
  limit: number,
  search: string,
  type: string,
) => {
  return useQuery({
    queryKey: ["approvers", page, limit, search, type],
    queryFn: () => getApprovers(page, limit, search, type),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
