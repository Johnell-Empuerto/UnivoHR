import api from "./api";

export interface CompanyOverview {
  attendance: {
    present: number;
    late: number;
    absent: number;
    on_leave: number;
    total: number;
  };
  anomalies: {
    open_count: number;
    high_severity_count: number;
    today_detected_count: number;
    resolved_count: number;
  };
  timestamp: string;
}

export interface AnomalyTrendPoint {
  date: string;
  total: number;
  high: number;
  medium: number;
  low: number;
}

export interface DepartmentComparison {
  branch_id: number;
  department: string;
  present: number;
  late: number;
  absent: number;
  on_leave: number;
}

export const getAnalyticsOverview = async (): Promise<CompanyOverview> => {
  const response = await api.get("/analytics/overview");
  return response.data;
};

export const getAnomalyTrend = async (days: number = 30): Promise<AnomalyTrendPoint[]> => {
  const response = await api.get("/analytics/anomaly-trend", { params: { days } });
  return response.data;
};

export const getForecastSummary = async (): Promise<Record<string, unknown>[]> => {
  const response = await api.get("/analytics/forecast-summary");
  return response.data;
};

export const getDepartmentComparison = async (): Promise<DepartmentComparison[]> => {
  const response = await api.get("/analytics/department-comparison");
  return response.data;
};
