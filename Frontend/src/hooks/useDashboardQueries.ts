import { useQuery } from "@tanstack/react-query";
import {
  getDashboardSummary,
  getAdminAnalytics,
  getTodayStatus,
  getMyAnalytics,
} from "@/services/dashboardService";
import { getAnomalySummary } from "@/services/anomalyService";
import { leaveService } from "@/services/leaveService";
import {
  getEmploymentStats,
  getDueForRegularization,
} from "@/services/employeeService";
import { getSetting } from "@/services/settingsService";

export const useAdminDashboardSummary = (enabled = true) =>
  useQuery({
    queryKey: ["dashboard", "admin", "summary"],
    queryFn: getDashboardSummary,
    staleTime: 30 * 1000,
    enabled,
  });

export const useAdminAnalytics = (enabled = true) =>
  useQuery({
    queryKey: ["dashboard", "admin", "analytics"],
    queryFn: getAdminAnalytics,
    staleTime: 30 * 1000,
    enabled,
  });

export const useAnomalySummaryQuery = (enabled = true) =>
  useQuery({
    queryKey: ["anomaly-summary"],
    queryFn: getAnomalySummary,
    staleTime: 30 * 1000,
    enabled,
  });

export const useEmploymentStats = (enabled = true) =>
  useQuery({
    queryKey: ["employees", "stats"],
    queryFn: getEmploymentStats,
    staleTime: 5 * 60 * 1000,
    enabled,
  });

export const useDueForRegularization = (enabled = true) =>
  useQuery({
    queryKey: ["employees", "due-for-regularization"],
    queryFn: getDueForRegularization,
    staleTime: 5 * 60 * 1000,
    enabled,
  });

export const useMyAnalytics = (enabled = true) =>
  useQuery({
    queryKey: ["dashboard", "employee", "analytics"],
    queryFn: getMyAnalytics,
    staleTime: 30 * 1000,
    enabled,
  });

export const useTodayStatus = (enabled = true) =>
  useQuery({
    queryKey: ["dashboard", "employee", "today"],
    queryFn: getTodayStatus,
    staleTime: 15 * 1000,
    enabled,
  });

export const useLeaveCredits = (enabled = true) =>
  useQuery({
    queryKey: ["leave-credits", "my"],
    queryFn: () => leaveService.getLeaveCredits(),
    staleTime: 60 * 1000,
    enabled,
  });

export const useMyRecentLeaves = (enabled = true) =>
  useQuery({
    queryKey: ["leaves", "my", "recent"],
    queryFn: async () => {
      const res = await leaveService.getMyLeaves();
      return res?.data?.slice(0, 3) || [];
    },
    staleTime: 30 * 1000,
    enabled,
  });

export const useWebClockSetting = (enabled = true) =>
  useQuery({
    queryKey: ["settings", "enable_web_clock_in_out"],
    queryFn: async () => {
      const setting = await getSetting("enable_web_clock_in_out");
      return setting?.value === "true";
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
