import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getUsers } from "@/services/userService";

export const useUsersList = (
  page: number,
  limit: number,
  search: string,
  roleFilter: string,
) => {
  return useQuery({
    queryKey: ["users-list", page, limit, search, roleFilter],
    queryFn: () => getUsers(page, limit, search, roleFilter),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
