import api from "./api";

export interface ReportParams {
  reportType?: string;
  status?: string;
  department?: string;
  branch_id?: string;
  deductionType?: string;
  startDate?: string;
  endDate?: string;
  cutoffStart?: string;
  cutoffEnd?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReportResponse {
  data: Record<string, unknown>[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getEmployeeReport = async (params: ReportParams): Promise<ReportResponse> => {
  const response = await api.get("/reports/employees", { params });
  return response.data;
};

export const getLeaveReport = async (params: ReportParams): Promise<ReportResponse> => {
  const response = await api.get("/reports/leaves", { params });
  return response.data;
};

export const getAttendanceReport = async (params: ReportParams): Promise<ReportResponse> => {
  const response = await api.get("/reports/attendance", { params });
  return response.data;
};

export const getPayrollReport = async (params: ReportParams): Promise<ReportResponse> => {
  const response = await api.get("/reports/payroll", { params });
  return response.data;
};

export const getBenefitsReport = async (params: ReportParams): Promise<ReportResponse> => {
  const response = await api.get("/reports/benefits", { params });
  return response.data;
};

export const getPerformanceReport = async (params: ReportParams): Promise<ReportResponse> => {
  const response = await api.get("/reports/performance", { params });
  return response.data;
};

export const exportReport = async (params: ReportParams & { reportCategory: string }): Promise<Blob> => {
  const response = await api.get("/reports/export", {
    params,
    responseType: "blob",
    timeout: 60000,
  });
  return response.data;
};
