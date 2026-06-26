import { useQuery } from "@tanstack/react-query";
import { getActiveShifts, getShifts } from "@/services/shiftService";

export const useActiveShifts = () => {
  return useQuery({
    queryKey: ["shifts", "active"],
    queryFn: getActiveShifts,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useShifts = () => {
  return useQuery({
    queryKey: ["shifts", "all"],
    queryFn: getShifts,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
