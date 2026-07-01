import { useQuery } from "@tanstack/react-query";
import { getAllHrAssignments } from "@/services/hrFormService";

export const useHrFormAssignments = (page: number, limit: number, search: string) => {
  return useQuery({
    queryKey: ["hr-form-assignments", page, limit, search],
    queryFn: () => getAllHrAssignments(page, limit, search),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
