import { useQuery } from "@tanstack/react-query";
import { fetchPayrollRules } from "@/services/payrollRulesService";

export const usePayrollRules = () => {
  return useQuery({
    queryKey: ["payroll-rules"],
    queryFn: fetchPayrollRules,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
