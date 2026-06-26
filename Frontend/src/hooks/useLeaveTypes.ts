import { useQuery } from "@tanstack/react-query";
import { getEnabledLeaveTypes, getAllLeaveTypesAdmin, getLeaveTypes } from "@/services/leaveService";

export const useEnabledLeaveTypes = () => {
  return useQuery({
    queryKey: ["leave-types", "enabled"],
    queryFn: getEnabledLeaveTypes,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useAllLeaveTypesAdmin = () => {
  return useQuery({
    queryKey: ["leave-types", "all"],
    queryFn: getAllLeaveTypesAdmin,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useLeaveConversionTypes = () => {
  return useQuery({
    queryKey: ["leave-conversion", "types"],
    queryFn: getLeaveTypes,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
