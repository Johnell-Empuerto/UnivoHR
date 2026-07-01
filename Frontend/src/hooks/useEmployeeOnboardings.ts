import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getEmployeeOnboardings } from "@/services/employeeOnboardingService";

export const useEmployeeOnboardings = (
  page: number,
  limit: number,
  search: string,
  status: string,
) => {
  return useQuery({
    queryKey: ["employee-onboardings", page, limit, search, status],
    queryFn: () => getEmployeeOnboardings(page, limit, search, status),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
