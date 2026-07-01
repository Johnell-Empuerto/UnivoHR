import api from "./api";

export const getApplicantFamily = async (applicantId: number) => {
  const response = await api.get(`/applicants/${applicantId}/family`);
  return response.data;
};

export const createApplicantFamily = async (applicantId: number, data: Record<string, unknown>) => {
  const response = await api.post(`/applicants/${applicantId}/family`, data);
  return response.data;
};

export const updateApplicantFamily = async (applicantId: number, id: number, data: Record<string, unknown>) => {
  const response = await api.put(`/applicants/${applicantId}/family/${id}`, data);
  return response.data;
};

export const deleteApplicantFamily = async (applicantId: number, id: number) => {
  const response = await api.delete(`/applicants/${applicantId}/family/${id}`);
  return response.data;
};

export const getApplicantEducation = async (applicantId: number) => {
  const response = await api.get(`/applicants/${applicantId}/education`);
  return response.data;
};

export const createApplicantEducation = async (applicantId: number, data: Record<string, unknown>) => {
  const response = await api.post(`/applicants/${applicantId}/education`, data);
  return response.data;
};

export const updateApplicantEducation = async (applicantId: number, id: number, data: Record<string, unknown>) => {
  const response = await api.put(`/applicants/${applicantId}/education/${id}`, data);
  return response.data;
};

export const deleteApplicantEducation = async (applicantId: number, id: number) => {
  const response = await api.delete(`/applicants/${applicantId}/education/${id}`);
  return response.data;
};

export const getApplicantExperience = async (applicantId: number) => {
  const response = await api.get(`/applicants/${applicantId}/experience`);
  return response.data;
};

export const createApplicantExperience = async (applicantId: number, data: Record<string, unknown>) => {
  const response = await api.post(`/applicants/${applicantId}/experience`, data);
  return response.data;
};

export const updateApplicantExperience = async (applicantId: number, id: number, data: Record<string, unknown>) => {
  const response = await api.put(`/applicants/${applicantId}/experience/${id}`, data);
  return response.data;
};

export const deleteApplicantExperience = async (applicantId: number, id: number) => {
  const response = await api.delete(`/applicants/${applicantId}/experience/${id}`);
  return response.data;
};
