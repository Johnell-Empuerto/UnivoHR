import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { searchEmployeesPaginated } from "@/services/overtimeService";

export const useEmployeeSearch = (
  params: {
    page: number;
    limit: number;
    search: string;
    status?: string;
    hasUser?: boolean;
  },
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ["employee-search", params],
    queryFn: () => searchEmployeesPaginated(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
