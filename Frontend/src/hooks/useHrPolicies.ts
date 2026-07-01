import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getHrPolicies,
  getHrPoliciesPaginated,
} from "@/services/hrPolicyService";

export const useAdminHrPolicies = (
  page: number,
  pageSize: number,
  search: string,
  category: string,
  status: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ["hr-policies", "admin", page, pageSize, search, category, status],
    queryFn: () => getHrPoliciesPaginated(page, pageSize, search, category, status),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useAllHrPolicies = (enabled: boolean) => {
  return useQuery({
    queryKey: ["hr-policies", "all"],
    queryFn: getHrPolicies,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
