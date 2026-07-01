import api from "./api";

export const runDailyStatScan = async (): Promise<Record<string, unknown>> => {
  const response = await api.post("/stats-anomaly/scan/daily");
  return response.data;
};

export const runWeeklyStatScan = async (): Promise<Record<string, unknown>> => {
  const response = await api.post("/stats-anomaly/scan/weekly");
  return response.data;
};
