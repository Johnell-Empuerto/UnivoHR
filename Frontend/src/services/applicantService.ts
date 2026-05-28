import api from "./api";

export const getApplicants = async (page = 1, limit = 10, search = "", status = "", job_position_id = "") => {
  const response = await api.get("/applicants", { params: { page, limit, search, status, job_position_id } });
  return response.data;
};

export const getApplicantById = async (id: number) => {
  const response = await api.get(`/applicants/${id}`);
  return response.data;
};

export const createApplicant = async (data: any) => {
  const response = await api.post("/applicants", data);
  return response.data;
};

export const updateApplicant = async (id: number, data: any) => {
  const response = await api.put(`/applicants/${id}`, data);
  return response.data;
};

export const deleteApplicant = async (id: number) => {
  const response = await api.delete(`/applicants/${id}`);
  return response.data;
};

export const convertApplicantToEmployee = async (id: number, data: any) => {
  const response = await api.post(`/applicants/${id}/convert`, data);
  return response.data;
};
