import { useQuery } from "@tanstack/react-query";
import { getHrAssignmentById } from "@/services/hrFormService";

export const useHrAssignmentById = (assignmentId: number | undefined) => {
  return useQuery({
    queryKey: ["hr-assignment", assignmentId],
    queryFn: () => getHrAssignmentById(assignmentId!),
    enabled: !!assignmentId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
