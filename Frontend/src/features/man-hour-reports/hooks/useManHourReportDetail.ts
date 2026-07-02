import { useQuery } from "@tanstack/react-query";
import { getManHourReportDetails } from "@/services/manHourReportService";

export const useManHourReportDetail = (id: number | null) => {
  return useQuery({
    queryKey: ["man-hour-report-detail", id],
    queryFn: () => getManHourReportDetails(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
