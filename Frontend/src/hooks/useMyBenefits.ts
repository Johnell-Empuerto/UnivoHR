import { useQuery } from "@tanstack/react-query";
import { getMyBenefits } from "@/services/payrollService";

export const useMyBenefits = () => {
  return useQuery({
    queryKey: ["my-benefits"],
    queryFn: getMyBenefits,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
