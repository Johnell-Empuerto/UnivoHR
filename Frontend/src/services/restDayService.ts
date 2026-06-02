import api from "./api";

export interface EmployeeRestDay {
  id: number;
  employee_id: number;
  day_of_week: number;
  effective_date: string;
  end_date: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BranchRestDay {
  id: number;
  branch_id: number;
  day_of_week: number;
  is_active: boolean;
  branch_name?: string;
  created_at?: string;
  updated_at?: string;
}

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const getDayLabel = (dow: number): string => DAY_LABELS[dow] ?? "Unknown";

export const getAllDayLabels = (): string[] => [...DAY_LABELS];

// ─── Employee Rest Days ───────────────────────────

export const getEmployeeRestDays = async (employeeId: number): Promise<EmployeeRestDay[]> => {
  const response = await api.get(`/employees/${employeeId}/rest-days`);
  return response.data;
};

export const createEmployeeRestDay = async (
  employeeId: number,
  data: { day_of_week: number; effective_date?: string; end_date?: string | null }
): Promise<EmployeeRestDay> => {
  const response = await api.post(`/employees/${employeeId}/rest-days`, data);
  return response.data;
};

export const updateEmployeeRestDay = async (
  id: number,
  data: { day_of_week?: number; effective_date?: string; end_date?: string | null }
): Promise<EmployeeRestDay> => {
  const response = await api.put(`/employees/${id}/rest-days`, data);
  return response.data;
};

export const deleteEmployeeRestDay = async (id: number): Promise<void> => {
  await api.delete(`/employees/${id}/rest-days`);
};

// ─── Branch Rest Days ────────────────────────────

export const getBranchRestDays = async (branchId: number): Promise<BranchRestDay[]> => {
  const response = await api.get(`/branch-rest-days/${branchId}`);
  return response.data;
};

export const getAllBranchRestDays = async (): Promise<BranchRestDay[]> => {
  const response = await api.get("/branch-rest-days");
  return response.data;
};

export const createBranchRestDay = async (
  branchId: number,
  data: { day_of_week: number }
): Promise<BranchRestDay> => {
  const response = await api.post(`/branch-rest-days/${branchId}`, data);
  return response.data;
};

export const deleteBranchRestDay = async (id: number): Promise<void> => {
  await api.delete(`/branch-rest-days/${id}`);
};
