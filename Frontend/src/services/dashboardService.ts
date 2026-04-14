// services/dashboardService.ts
import api from "./api";

// Get company summary (admin)
export const getDashboardSummary = async () => {
  const response = await api.get("/dashboard/summary");
  return response.data;
};

// Get admin analytics (NEW)
export const getAdminAnalytics = async () => {
  const response = await api.get("/dashboard/analytics");
  return response.data;
};

// Get employee monthly summary
export const getMySummary = async () => {
  const response = await api.get("/dashboard/me/summary");
  return response.data;
};

// Get today's attendance status
export const getTodayStatus = async () => {
  const response = await api.get("/dashboard/me/today");
  return response.data;
};

// Get employee analytics (summary + trends)
export const getMyAnalytics = async () => {
  const response = await api.get("/dashboard/me/analytics");
  return response.data;
};
