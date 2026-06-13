import api from "./api";

export const getHrForms = async (page = 1, limit = 10, search = "") => {
  const response = await api.get("/hr-forms", { params: { page, limit, search } });
  return response.data;
};

export const getHrFormById = async (id: number) => {
  const response = await api.get(`/hr-forms/${id}`);
  return response.data;
};

export const createHrForm = async (data: any) => {
  const response = await api.post("/hr-forms", data);
  return response.data;
};

export const updateHrForm = async (id: number, data: any) => {
  const response = await api.patch(`/hr-forms/${id}`, data);
  return response.data;
};

export const deleteHrForm = async (id: number) => {
  const response = await api.delete(`/hr-forms/${id}`);
  return response.data;
};

export const getHrFormFields = async (formId: number) => {
  const response = await api.get(`/hr-forms/${formId}/fields`);
  return response.data;
};

export const addHrFormField = async (formId: number, data: any) => {
  const response = await api.post(`/hr-forms/${formId}/fields`, data);
  return response.data;
};

export const updateHrFormField = async (fieldId: number, data: any) => {
  const response = await api.put(`/hr-forms/fields/${fieldId}`, data);
  return response.data;
};

export const deleteHrFormField = async (fieldId: number) => {
  const response = await api.delete(`/hr-forms/fields/${fieldId}`);
  return response.data;
};

export const assignHrForm = async (data: { form_id: number; employee_ids: number[]; due_date?: string }) => {
  const response = await api.post(`/hr-forms/${data.form_id}/assign`, data);
  return response.data;
};

export const getAllHrAssignments = async (page = 1, limit = 10, search = "") => {
  const response = await api.get("/hr-forms/assignments/all", { params: { page, limit, search } });
  return response.data;
};

export const getMyHrAssignments = async (page = 1, limit = 10) => {
  const response = await api.get("/hr-forms/my-assignments", { params: { page, limit } });
  return response.data;
};

export const getHrAssignmentById = async (assignmentId: number) => {
  const response = await api.get(`/hr-forms/assignments/${assignmentId}`);
  return response.data;
};

export const submitHrForm = async (assignmentId: number, data: any) => {
  const response = await api.post(`/hr-forms/assignments/${assignmentId}/submit`, data);
  return response.data;
};

export const getHrSubmissions = async (page = 1, limit = 10, search = "") => {
  const response = await api.get("/hr-forms/submissions/all", { params: { page, limit, search } });
  return response.data;
};

export const getHrSubmissionById = async (submissionId: number) => {
  const response = await api.get(`/hr-forms/submissions/${submissionId}`);
  return response.data;
};

export const reviewHrSubmission = async (submissionId: number, data: { remarks?: string }) => {
  const response = await api.patch(`/hr-forms/submissions/${submissionId}/review`, data);
  return response.data;
};
