import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAuditLogs } from "@/services/auditLogService";

export const useAuditLogs = (
  page: number,
  limit: number,
  search: string,
  action: string,
  tableName: string,
  dateFrom: string,
  dateTo: string,
) => {
  return useQuery({
    queryKey: ["audit-logs", page, limit, search, action, tableName, dateFrom, dateTo],
    queryFn: () =>
      getAuditLogs({
        page,
        limit,
        search: search || undefined,
        action: action || undefined,
        table_name: tableName || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
