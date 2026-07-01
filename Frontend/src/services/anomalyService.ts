import api from "./api";

export interface Anomaly {
  id: number;
  employee_id: number;
  branch_id: number | null;
  anomaly_type: string;
  source_module: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  description: string | null;
  detected_value: string | null;
  expected_value: string | null;
  status: "OPEN" | "REVIEWED" | "RESOLVED";
  detected_at: string;
  reviewed_at: string | null;
  resolved_at: string | null;
  reviewed_by: number | null;
  resolved_by: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  suffix: string | null;
  employee_code: string;
  branch_name: string | null;
  reviewer_name: string | null;
  resolver_name: string | null;
  employee_name: string;
}

export interface AnomalySummary {
  open_count: number;
  high_severity_count: number;
  today_detected_count: number;
  resolved_count: number;
}

export interface ScanResult {
  results: {
    total_detected: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface AnomaliesResponse {
  data: Anomaly[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getAnomalies = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  branch_id?: string;
  employee_id?: string;
  anomaly_type?: string;
  source_module?: string;
  date_from?: string;
  date_to?: string;
}): Promise<AnomaliesResponse> => {
  const response = await api.get("/anomalies", { params });
  return response.data;
};

export const getAnomalySummary = async (): Promise<AnomalySummary> => {
  const response = await api.get("/anomalies/summary");
  return response.data;
};

export const getAnomalyById = async (id: number): Promise<Anomaly> => {
  const response = await api.get(`/anomalies/${id}`);
  return response.data;
};

export const updateAnomalyStatus = async (
  id: number,
  status: "REVIEWED" | "RESOLVED"
): Promise<Anomaly> => {
  const response = await api.patch(`/anomalies/${id}/status`, { status });
  return response.data;
};

export const runDailyScan = async (): Promise<ScanResult> => {
  const response = await api.post("/anomalies/scan/daily");
  return response.data;
};

export const runWeeklyScan = async (): Promise<ScanResult> => {
  const response = await api.post("/anomalies/scan/weekly");
  return response.data;
};
