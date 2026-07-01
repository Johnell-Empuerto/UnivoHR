import api from "./api";

export const getApplicantRequirements = async (applicantId: number) => {
  const response = await api.get(`/applicants/${applicantId}/requirements`);
  return response.data;
};

export const createApplicantRequirement = async (applicantId: number, data: Record<string, unknown>) => {
  const response = await api.post(`/applicants/${applicantId}/requirements`, data);
  return response.data;
};

export const updateApplicantRequirement = async (applicantId: number, requirementId: number, data: Record<string, unknown>) => {
  const response = await api.patch(`/applicants/${applicantId}/requirements/${requirementId}`, data);
  return response.data;
};

export const deleteApplicantRequirement = async (applicantId: number, requirementId: number) => {
  const response = await api.delete(`/applicants/${applicantId}/requirements/${requirementId}`);
  return response.data;
};
