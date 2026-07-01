import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMyManHourReports } from "@/services/manHourReportService";

export const useMyManHoursReport = (
  page: number,
  limit: number,
  search: string,
  status: string,
) => {
  return useQuery({
    queryKey: ["my-man-hour-reports", page, limit, search, status],
    queryFn: () => getMyManHourReports(page, limit, search, status),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
