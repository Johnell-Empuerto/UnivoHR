import { useQuery } from "@tanstack/react-query";
import { getRotationPatterns } from "@/services/rotationService";

export const useRotationPatterns = () => {
  return useQuery({
    queryKey: ["rotation-patterns"],
    queryFn: getRotationPatterns,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
