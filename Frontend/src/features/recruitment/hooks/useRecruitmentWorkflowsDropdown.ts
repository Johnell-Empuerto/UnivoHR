import { useQuery } from "@tanstack/react-query";
import { getRecruitmentWorkflows } from "@/services/recruitmentWorkflowService";

export const useRecruitmentWorkflowsDropdown = () => {
  return useQuery({
    queryKey: ["recruitment-workflows-dropdown"],
    queryFn: async () => {
      const result = await getRecruitmentWorkflows();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
