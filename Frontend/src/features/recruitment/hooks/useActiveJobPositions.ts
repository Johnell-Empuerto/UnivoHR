import { useQuery } from "@tanstack/react-query";
import { getActiveJobPositions } from "@/services/jobPositionService";

export const useActiveJobPositions = () => {
  return useQuery({
    queryKey: ["active-job-positions"],
    queryFn: () => getActiveJobPositions(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
