import { useQuery } from "@tanstack/react-query";
import { getWorkflowStages } from "@/services/recruitmentWorkflowService";

export const useWorkflowStages = (workflowId: number | null) => {
  return useQuery({
    queryKey: ["workflow-stages", workflowId],
    queryFn: () => getWorkflowStages(workflowId!),
    enabled: !!workflowId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
