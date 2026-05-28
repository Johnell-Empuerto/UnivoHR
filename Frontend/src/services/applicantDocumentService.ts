import api from "./api";

export const getApplicantDocuments = async (applicantId: number) => {
  const response = await api.get(`/applicant-documents/${applicantId}`);
  return response.data;
};

export const uploadApplicantDocument = async (applicantId: number, data: any) => {
  const response = await api.post(`/applicant-documents/${applicantId}`, data);
  return response.data;
};

export const deleteApplicantDocument = async (id: number) => {
  const response = await api.delete(`/applicant-documents/${id}`);
  return response.data;
};
