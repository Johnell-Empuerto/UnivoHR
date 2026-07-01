import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getAllTimeModificationRequests,
  getMyTimeModificationRequests,
} from "@/services/attendanceService";

export const useTimeModificationRequests = (
  isAdmin: boolean,
  page: number,
  limit: number,
) => {
  return useQuery({
    queryKey: ["time-modification-requests", isAdmin, page, limit],
    queryFn: async () => {
      const result = isAdmin
        ? await getAllTimeModificationRequests(page, limit)
        : await getMyTimeModificationRequests(page, limit);

      if (result.data && result.pagination) {
        return result;
      }
      if (Array.isArray(result)) {
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedData = result.slice(start, end);
        return {
          data: paginatedData,
          pagination: {
            total: result.length,
            page,
            limit,
            totalPages: Math.ceil(result.length / limit),
          },
        };
      }
      return { data: [], pagination: { total: 0, page, limit, totalPages: 1 } };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
