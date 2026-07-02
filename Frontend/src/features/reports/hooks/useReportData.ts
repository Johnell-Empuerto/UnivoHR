import { useQuery } from "@tanstack/react-query";
import {
  getEmployeeReport,
  getLeaveReport,
  getAttendanceReport,
  getPayrollReport,
  getBenefitsReport,
  getPerformanceReport,
} from "@/services/reportService";

type ReportParams = Record<string, unknown>;

const getReportFn = (activeTab: string) => {
  switch (activeTab) {
    case "employees": return getEmployeeReport;
    case "leaves": return getLeaveReport;
    case "attendance": return getAttendanceReport;
    case "payroll": return getPayrollReport;
    case "benefits": return getBenefitsReport;
    case "performance": return getPerformanceReport;
    default: return null;
  }
};

export const useReportData = (activeTab: string, params: ReportParams) => {
  const queryKey = ["report", activeTab, JSON.stringify(params)];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const fn = getReportFn(activeTab);
      if (!fn) throw new Error(`Unknown report tab: ${activeTab}`);
      return fn(params);
    },
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });
};
