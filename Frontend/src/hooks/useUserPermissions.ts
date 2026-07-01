import { useQuery } from "@tanstack/react-query";
import { getUserPermissions } from "@/services/permissionService";

export const useUserPermissions = (userId: number | undefined) => {
  return useQuery({
    queryKey: ["permissions", "user", userId],
    queryFn: () => getUserPermissions(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
