import api from "./api";

export interface LeaveConversion {
  id: number;
  employee_id: number;
  year: number;
  leave_type: string;
  days_converted: number;
  daily_rate: number;
  conversion_rate: number;
  amount: number;
  processed_by: number | null;
  created_at: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  suffix: string;
  employee_code: string;
}

export interface ConversionSummary {
  total_conversions: number;
  total_amount: number;
  total_employees: number;
  total_years: number;
  total_days_converted: number;
}

export interface YearlySummary {
  year: number;
  conversion_count: number;
  employees_count: number;
  total_days: number;
  total_amount: number;
}

export const historyLeaveService = {
  // Get all conversions with pagination
  getAll: async (page = 1, limit = 10, search = "", year = "") => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (year) params.append("year", year.toString());

    const response = await api.get(`/history-leave?${params.toString()}`);
    return response.data;
  },

  // Get summary stats
  getSummary: async () => {
    const response = await api.get("/history-leave/summary");
    return response.data;
  },

  // Get yearly summary
  getYearlySummary: async () => {
    const response = await api.get("/history-leave/yearly-summary");
    return response.data;
  },

  // Get available years
  getAvailableYears: async () => {
    const response = await api.get("/history-leave/available-years");
    return response.data;
  },

  // Get employee summary
  getEmployeeSummary: async (employeeId: number) => {
    const response = await api.get(`/history-leave/employee/${employeeId}`);
    return response.data;
  },
};
