import { useQuery } from "@tanstack/react-query";
import { getDeductions } from "@/services/payrollService";

export const useDeductions = (employeeId: number | null) => {
  return useQuery({
    queryKey: ["deductions", employeeId],
    queryFn: () => getDeductions(employeeId!),
    enabled: !!employeeId,
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });
};
