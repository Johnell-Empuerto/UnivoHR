import { useQuery } from "@tanstack/react-query";
import { getEmployeeAllowances } from "@/services/allowanceService";

export const useEmployeeAllowances = (employeeId: number | null) => {
  return useQuery({
    queryKey: ["employee-allowances", employeeId],
    queryFn: () => getEmployeeAllowances(employeeId!),
    enabled: !!employeeId,
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });
};
