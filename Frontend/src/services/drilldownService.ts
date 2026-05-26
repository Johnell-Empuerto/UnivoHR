import api from "./api";

export interface DrillDownParams {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  branch_id?: string;
  employee_id?: string;
  date_from?: string;
  date_to?: string;
  anomaly_type?: string;
  type?: string;
  cutoff_start?: string;
  cutoff_end?: string;
  min_net?: string;
  max_net?: string;
}

export interface DrillDownResponse {
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getDrillDownAttendance = async (params?: DrillDownParams): Promise<DrillDownResponse> => {
  const response = await api.get("/drilldown/attendance", { params });
  return response.data;
};

export const getDrillDownPayroll = async (params?: DrillDownParams): Promise<DrillDownResponse> => {
  const response = await api.get("/drilldown/payroll", { params });
  return response.data;
};

export const getDrillDownOvertime = async (params?: DrillDownParams): Promise<DrillDownResponse> => {
  const response = await api.get("/drilldown/overtime", { params });
  return response.data;
};

export const getDrillDownLeaves = async (params?: DrillDownParams): Promise<DrillDownResponse> => {
  const response = await api.get("/drilldown/leaves", { params });
  return response.data;
};

export const getDrillDownAnomalies = async (params?: DrillDownParams): Promise<DrillDownResponse> => {
  const response = await api.get("/drilldown/anomalies", { params });
  return response.data;
};

export const getDrillDownBranches = async (params?: DrillDownParams): Promise<DrillDownResponse> => {
  const response = await api.get("/drilldown/branches", { params });
  return response.data;
};

export const exportDrillDown = async (params: DrillDownParams & { module: string }): Promise<Blob> => {
  const response = await api.get("/drilldown/export", {
    params,
    responseType: "blob",
  });
  return response.data;
};
