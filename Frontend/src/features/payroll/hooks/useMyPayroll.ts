import { useQuery } from "@tanstack/react-query";
import { getMyPayroll } from "@/services/payrollService";

export const useMyPayroll = (cutoffStart: string, cutoffEnd: string) => {
  return useQuery({
    queryKey: ["my-payroll", cutoffStart, cutoffEnd],
    queryFn: () => getMyPayroll(cutoffStart, cutoffEnd),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
