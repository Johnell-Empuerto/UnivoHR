import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  attendance as attendanceApi,
  getAttendanceByEmployee,
} from "@/services/attendanceService";

export const useAttendanceRecords = (
  isAdmin: boolean,
  employeeId: number | undefined,
  page: number,
  limit: number,
  search: string,
  status: string,
  date: string,
  branch: string,
) => {
  return useQuery({
    queryKey: ["attendance", isAdmin, page, limit, search, status, date, branch, employeeId],
    queryFn: async () => {
      if (!isAdmin) {
        if (!employeeId) return { data: [], pagination: { total: 0, page: 1, limit, totalPages: 1 } };
        const data = await getAttendanceByEmployee(employeeId, date);
        return {
          data,
          pagination: {
            total: data.length,
            page: 1,
            limit: data.length,
            totalPages: 1,
          },
        };
      }
      return attendanceApi(page, limit, search, status, date, branch);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
