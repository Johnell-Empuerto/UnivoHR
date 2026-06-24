import { useQuery } from "@tanstack/react-query";
import { getActiveBranches } from "@/services/branchService";

/**
 * Active branches are reference / static data, safe to cache for 10 minutes.
 * Mutations (create / update / status-change) should invalidate ["branches"] later.
 */
export const useActiveBranches = () => {
  return useQuery({
    queryKey: ["branches", "active"],
    queryFn: getActiveBranches,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
