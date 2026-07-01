import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAssignableUsers } from "@/services/applicantService";

export const useAssignableUsers = (
  page: number,
  limit: number,
  search: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ["assignable-users", page, limit, search],
    queryFn: () => getAssignableUsers(page, limit, search),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
