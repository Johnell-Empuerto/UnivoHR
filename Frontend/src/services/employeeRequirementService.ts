import api from "./api";

export const getEmployeeRequirements = async (onboardingId: number) => {
  const response = await api.get(`/employee-requirements/${onboardingId}`);
  return response.data;
};

export const createEmployeeRequirement = async (onboardingId: number, data: any) => {
  const response = await api.post(`/employee-requirements/${onboardingId}`, data);
  return response.data;
};

export const updateEmployeeRequirement = async (id: number, data: any) => {
  const response = await api.put(`/employee-requirements/${id}`, data);
  return response.data;
};

export const deleteEmployeeRequirement = async (id: number) => {
  const response = await api.delete(`/employee-requirements/${id}`);
  return response.data;
};
