import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMyHrAssignments } from "@/services/hrFormService";

export const useMyHrAssignments = (page: number, pageSize: number) => {
  return useQuery({
    queryKey: ["my-hr-assignments", page, pageSize],
    queryFn: () => getMyHrAssignments(page, pageSize),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
