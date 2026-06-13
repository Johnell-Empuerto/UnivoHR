import api from "./api";

export const getRecruitmentWorkflows = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  branch_id?: string;
  job_position_id?: string;
}) => {
  const response = await api.get("/recruitment-workflows", { params });
  return response.data;
};

export const getRecruitmentWorkflow = async (id: number, includeStages = true) => {
  const response = await api.get(`/recruitment-workflows/${id}`, {
    params: { include_stages: includeStages ? "true" : "false" },
  });
  return response.data;
};

export const createRecruitmentWorkflow = async (data: any) => {
  const response = await api.post("/recruitment-workflows", data);
  return response.data;
};

export const updateRecruitmentWorkflow = async (id: number, data: any) => {
  const response = await api.put(`/recruitment-workflows/${id}`, data);
  return response.data;
};

export const deleteRecruitmentWorkflow = async (id: number) => {
  const response = await api.delete(`/recruitment-workflows/${id}`);
  return response.data;
};

export const getWorkflowStages = async (workflowId: number) => {
  const response = await api.get(`/recruitment-workflows/${workflowId}/stages`);
  return response.data;
};

export const createWorkflowStage = async (workflowId: number, data: any) => {
  const response = await api.post(`/recruitment-workflows/${workflowId}/stages`, data);
  return response.data;
};

export const updateWorkflowStage = async (stageId: number, data: any) => {
  const response = await api.put(`/recruitment-workflows/stages/${stageId}`, data);
  return response.data;
};

export const deleteWorkflowStage = async (stageId: number) => {
  const response = await api.delete(`/recruitment-workflows/stages/${stageId}`);
  return response.data;
};

export const reorderWorkflowStages = async (workflowId: number, orderedStageIds: number[]) => {
  const response = await api.post(`/recruitment-workflows/${workflowId}/stages/reorder`, {
    orderedStageIds,
  });
  return response.data;
};
