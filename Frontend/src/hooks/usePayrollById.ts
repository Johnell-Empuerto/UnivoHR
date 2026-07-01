import { useQuery } from "@tanstack/react-query";
import { getPayrollById } from "@/services/payrollService";

export const usePayrollById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["payroll", id],
    queryFn: () => getPayrollById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
