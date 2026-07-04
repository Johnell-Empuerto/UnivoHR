import { useQuery } from "@tanstack/react-query";
import { getAllowanceTypes } from "@/services/allowanceService";

export const useAllowanceTypes = () => {
  return useQuery({
    queryKey: ["allowance-types"],
    queryFn: getAllowanceTypes,
    staleTime: 5 * 60 * 1000,
  });
};
