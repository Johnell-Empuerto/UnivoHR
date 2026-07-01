import api from "./api";

export const getApplicantInterviews = async (applicantId: number) => {
  const response = await api.get(`/applicant-interviews/${applicantId}`);
  return response.data;
};

export const createApplicantInterview = async (applicantId: number, data: Record<string, unknown>) => {
  const response = await api.post(`/applicant-interviews/${applicantId}`, data);
  return response.data;
};

export const updateApplicantInterview = async (id: number, data: Record<string, unknown>) => {
  const response = await api.put(`/applicant-interviews/${id}`, data);
  return response.data;
};

export const deleteApplicantInterview = async (id: number) => {
  const response = await api.delete(`/applicant-interviews/${id}`);
  return response.data;
};

export const getMyInterviews = async () => {
  const response = await api.get("/applicant-interviews/my");
  return response.data;
};

export const getPossibleInterviewers = async () => {
  const response = await api.get("/applicant-interviews/possible-interviewers");
  return response.data;
};
