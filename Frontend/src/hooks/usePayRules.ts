import { useQuery } from "@tanstack/react-query";
import { getPayRules } from "@/services/payRuleService";

export const usePayRules = () => {
  return useQuery({
    queryKey: ["pay-rules"],
    queryFn: getPayRules,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
