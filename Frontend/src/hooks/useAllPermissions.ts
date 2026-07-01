import { useQuery } from "@tanstack/react-query";
import { getAllPermissions } from "@/services/permissionService";

export const useAllPermissions = () => {
  return useQuery({
    queryKey: ["permissions", "all"],
    queryFn: getAllPermissions,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
