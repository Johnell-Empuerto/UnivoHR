import api from "./api";

export const getApplicantApprovals = async (applicantId: number) => {
  const response = await api.get(`/applicant-approvals/${applicantId}`);
  return response.data;
};

export const createApplicantApproval = async (applicantId: number, data: Record<string, unknown>) => {
  const response = await api.post(`/applicant-approvals/${applicantId}`, data);
  return response.data;
};

export const updateApplicantApproval = async (id: number, data: Record<string, unknown>) => {
  const response = await api.put(`/applicant-approvals/${id}`, data);
  return response.data;
};
