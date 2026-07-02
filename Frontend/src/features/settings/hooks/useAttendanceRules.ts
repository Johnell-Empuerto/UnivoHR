import { useQuery } from "@tanstack/react-query";
import { getAttendanceRules } from "@/services/attendanceService";

export const useAttendanceRules = () => {
  return useQuery({
    queryKey: ["attendance-rules"],
    queryFn: () => getAttendanceRules(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
