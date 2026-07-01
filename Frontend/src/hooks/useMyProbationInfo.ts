import { useQuery } from "@tanstack/react-query";
import { getMyProbationInfo } from "@/services/kpiService";

export const useMyProbationInfo = () => {
  return useQuery({
    queryKey: ["my-probation-info"],
    queryFn: getMyProbationInfo,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
