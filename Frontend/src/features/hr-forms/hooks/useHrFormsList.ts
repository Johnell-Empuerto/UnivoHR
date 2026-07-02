import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getHrForms } from "@/services/hrFormService";

export const useHrFormsList = (page: number, pageSize: number, search: string) => {
  return useQuery({
    queryKey: ["hr-forms", page, pageSize, search],
    queryFn: () => getHrForms(page, pageSize, search),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
