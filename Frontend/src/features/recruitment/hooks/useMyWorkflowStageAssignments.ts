import { useQuery } from "@tanstack/react-query";
import { getMyWorkflowStageAssignments } from "@/services/applicantService";

export const useMyWorkflowStageAssignments = () => {
  return useQuery({
    queryKey: ["my-workflow-stage-assignments"],
    queryFn: () => getMyWorkflowStageAssignments().catch(() => []),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
