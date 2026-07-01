import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getUsers } from "@/services/userService";

export const useUsers = (
  page: number,
  limit: number,
  search: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ["users", page, limit, search],
    queryFn: () => getUsers(page, limit, search),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
