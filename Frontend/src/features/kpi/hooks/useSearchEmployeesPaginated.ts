import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { searchEmployeesPaginated } from "@/services/overtimeService";

export const useSearchEmployeesPaginated = (
  search: string,
  page: number,
  limit: number,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ["search-employees-paginated", search, page, limit],
    queryFn: () =>
      searchEmployeesPaginated({
        page,
        limit,
        search,
        status: "ACTIVE",
        hasUser: false,
      }),
    enabled,
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
