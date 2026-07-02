import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getFinalPayHistory } from "@/services/finalPayService";

export const useFinalPayHistory = (page: number, limit: number, search: string) => {
  return useQuery({
    queryKey: ["final-pay-history", page, limit, search],
    queryFn: () => getFinalPayHistory(page, limit, search),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
