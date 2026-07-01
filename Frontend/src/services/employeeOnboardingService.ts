import api from "./api";

export const getEmployeeOnboardings = async (page = 1, limit = 10, search = "", status = "") => {
  const response = await api.get("/employee-onboarding", { params: { page, limit, search, status } });
  return response.data;
};

export const getEmployeeOnboardingById = async (id: number) => {
  const response = await api.get(`/employee-onboarding/${id}`);
  return response.data;
};

export const createEmployeeOnboarding = async (data: Record<string, unknown>) => {
  const response = await api.post("/employee-onboarding", data);
  return response.data;
};

export const updateEmployeeOnboarding = async (id: number, data: Record<string, unknown>) => {
  const response = await api.put(`/employee-onboarding/${id}`, data);
  return response.data;
};
