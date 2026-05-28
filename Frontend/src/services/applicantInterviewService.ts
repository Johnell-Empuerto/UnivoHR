import api from "./api";

export const getApplicantInterviews = async (applicantId: number) => {
  const response = await api.get(`/applicant-interviews/${applicantId}`);
  return response.data;
};

export const createApplicantInterview = async (applicantId: number, data: any) => {
  const response = await api.post(`/applicant-interviews/${applicantId}`, data);
  return response.data;
};

export const updateApplicantInterview = async (id: number, data: any) => {
  const response = await api.put(`/applicant-interviews/${id}`, data);
  return response.data;
};

export const deleteApplicantInterview = async (id: number) => {
  const response = await api.delete(`/applicant-interviews/${id}`);
  return response.data;
};
