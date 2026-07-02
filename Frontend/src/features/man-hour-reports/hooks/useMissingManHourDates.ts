import { useQuery } from "@tanstack/react-query";
import { getMissingManHourDates } from "@/services/manHourReportService";

export const useMissingManHourDates = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ["missing-man-hour-dates", startDate, endDate],
    queryFn: () => getMissingManHourDates(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
