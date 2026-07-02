import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAllManHourReports } from "@/services/manHourReportService";

export const useManHourReports = (
  page: number,
  limit: number,
  search: string,
  dateFilter: string,
) => {
  return useQuery({
    queryKey: ["man-hour-reports", page, limit, search, dateFilter],
    queryFn: () => getAllManHourReports(page, limit, search, dateFilter),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    select: (res) => ({
      data: res.data.map((report: any) => ({
        id: report.id,
        employee_name: report.employee_name,
        employee_code: report.employee_code,
        employee_id: report.employee_id,
        work_date: report.work_date,
        task: report.task,
        hours: report.hours,
        remarks: report.remarks,
        created_at: report.created_at,
        is_assigned_approver: report.is_assigned_approver ?? false,
        status: report.status || "SUBMITTED",
      })),
      pagination: res.pagination,
    }),
  });
};
