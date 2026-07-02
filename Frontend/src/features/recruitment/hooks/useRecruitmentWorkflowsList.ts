import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getRecruitmentWorkflows } from "@/services/recruitmentWorkflowService";

export const useRecruitmentWorkflowsList = (
  page: number,
  limit: number,
  search: string,
  isActive: string,
) => {
  return useQuery({
    queryKey: ["recruitment-workflows", page, limit, search, isActive],
    queryFn: () =>
      getRecruitmentWorkflows({
        page,
        limit,
        search,
        is_active: isActive === "all" ? "" : isActive,
      }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
