import { useQuery } from "@tanstack/react-query";
import { getMySalaryDetails } from "@/services/payrollService";

export const useMySalaryDetails = () => {
  return useQuery({
    queryKey: ["my-salary-details"],
    queryFn: getMySalaryDetails,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
