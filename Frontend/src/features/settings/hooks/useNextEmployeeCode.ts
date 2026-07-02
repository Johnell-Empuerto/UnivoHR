import { useQuery } from "@tanstack/react-query";
import { getNextEmployeeCode } from "@/services/settingsService";

export const useNextEmployeeCode = () => {
  return useQuery({
    queryKey: ["next-employee-code"],
    queryFn: () => getNextEmployeeCode(),
    enabled: false,
    staleTime: 0,
    gcTime: 0,
  });
};
