import api from "./api";

export const getEmployeeFamily = async (employeeId: number) => {
  const response = await api.get(`/employees/${employeeId}/family`);
  return response.data;
};

export const createEmployeeFamily = async (employeeId: number, data: any) => {
  const response = await api.post(`/employees/${employeeId}/family`, data);
  return response.data;
};

export const updateEmployeeFamily = async (employeeId: number, id: number, data: any) => {
  const response = await api.put(`/employees/${employeeId}/family/${id}`, data);
  return response.data;
};

export const deleteEmployeeFamily = async (employeeId: number, id: number) => {
  const response = await api.delete(`/employees/${employeeId}/family/${id}`);
  return response.data;
};

export const getEmployeeEducation = async (employeeId: number) => {
  const response = await api.get(`/employees/${employeeId}/education`);
  return response.data;
};

export const createEmployeeEducation = async (employeeId: number, data: any) => {
  const response = await api.post(`/employees/${employeeId}/education`, data);
  return response.data;
};

export const updateEmployeeEducation = async (employeeId: number, id: number, data: any) => {
  const response = await api.put(`/employees/${employeeId}/education/${id}`, data);
  return response.data;
};

export const deleteEmployeeEducation = async (employeeId: number, id: number) => {
  const response = await api.delete(`/employees/${employeeId}/education/${id}`);
  return response.data;
};

export const getEmployeeExperience = async (employeeId: number) => {
  const response = await api.get(`/employees/${employeeId}/experience`);
  return response.data;
};

export const createEmployeeExperience = async (employeeId: number, data: any) => {
  const response = await api.post(`/employees/${employeeId}/experience`, data);
  return response.data;
};

export const updateEmployeeExperience = async (employeeId: number, id: number, data: any) => {
  const response = await api.put(`/employees/${employeeId}/experience/${id}`, data);
  return response.data;
};

export const deleteEmployeeExperience = async (employeeId: number, id: number) => {
  const response = await api.delete(`/employees/${employeeId}/experience/${id}`);
  return response.data;
};
