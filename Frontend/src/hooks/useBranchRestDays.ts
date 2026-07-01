import { useQuery } from "@tanstack/react-query";
import { getAllBranchRestDays } from "@/services/restDayService";

export const useBranchRestDays = () => {
  return useQuery({
    queryKey: ["rest-days", "branch"],
    queryFn: getAllBranchRestDays,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
