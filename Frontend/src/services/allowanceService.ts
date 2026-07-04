import api from "./api";

export const getAllowanceTypes = async () => {
  const response = await api.get("/allowances/types");
  return response.data.data ?? [];
};

export const createAllowanceType = async (data: Record<string, unknown>) => {
  const response = await api.post("/allowances/types", data);
  return response.data;
};

export const updateAllowanceType = async (id: number, data: Record<string, unknown>) => {
  const response = await api.put(`/allowances/types/${id}`, data);
  return response.data;
};

export const deleteAllowanceType = async (id: number) => {
  const response = await api.delete(`/allowances/types/${id}`);
  return response.data;
};

export const getEmployeeAllowances = async (employeeId: number) => {
  const response = await api.get(`/allowances/employee/${employeeId}`);
  return response.data.data ?? [];
};

export const createEmployeeAllowance = async (data: Record<string, unknown>) => {
  const response = await api.post("/allowances/employee", data);
  return response.data;
};

export const updateEmployeeAllowance = async (id: number, data: Record<string, unknown>) => {
  const response = await api.put(`/allowances/employee/${id}`, data);
  return response.data;
};

export const deleteEmployeeAllowance = async (id: number) => {
  const response = await api.delete(`/allowances/employee/${id}`);
  return response.data;
};
