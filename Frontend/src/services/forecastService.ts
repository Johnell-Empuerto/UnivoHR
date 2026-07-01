import api from "./api";

export interface ForecastLog {
  id: number;
  metric_name: string;
  branch_id: number | null;
  department: string | null;
  predicted_value: number;
  confidence: number;
  forecast_date: string;
  period_type: string;
  method: string;
  actual_value: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ForecastHistoryResponse {
  data: ForecastLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const generateForecasts = async (branch_id?: number): Promise<Record<string, unknown>> => {
  const response = await api.post("/forecast/generate", { branch_id });
  return response.data;
};

export const getForecastHistory = async (params?: {
  metric_name?: string;
  branch_id?: string;
  period_type?: string;
  page?: number;
  limit?: number;
}): Promise<ForecastHistoryResponse> => {
  const response = await api.get("/forecast/history", { params });
  return response.data;
};

export const getLatestForecasts = async (params?: {
  metric_name?: string;
  branch_id?: string;
}): Promise<ForecastLog[]> => {
  const response = await api.get("/forecast/latest", { params });
  return response.data;
};

export const getForecastAccuracy = async (params?: {
  metric_name?: string;
  branch_id?: string;
  period_type?: string;
}): Promise<Record<string, unknown>[]> => {
  const response = await api.get("/forecast/accuracy", { params });
  return response.data;
};

export const updateForecastActual = async (id: number, actual_value: number): Promise<ForecastLog> => {
  const response = await api.patch(`/forecast/${id}/actual`, { actual_value });
  return response.data;
};
