import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getHrSubmissions } from "@/services/hrFormService";

export const useHrFormSubmissions = (page: number, pageSize: number, search: string) => {
  return useQuery({
    queryKey: ["hr-form-submissions", page, pageSize, search],
    queryFn: () => getHrSubmissions(page, pageSize, search),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
