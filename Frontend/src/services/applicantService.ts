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

export const repairApplicantStageRecords = async (id: number) => {
  const response = await api.post(`/applicants/${id}/repair-stage-records`);
  return response.data;
};

export const getApplicantWorkflowTimeline = async (id: number) => {
  const response = await api.get(`/applicants/${id}/workflow-timeline`);
  return response.data;
};

export const updateWorkflowStage = async (stageRecordId: number, data: any) => {
  const response = await api.put(`/applicants/workflow-stages/${stageRecordId}`, data);
  return response.data;
};

export const completeWorkflowStage = async (stageRecordId: number, data: any) => {
  const response = await api.post(`/applicants/workflow-stages/${stageRecordId}/complete`, data);
  return response.data;
};

export const moveToNextWorkflowStage = async (applicantId: number, currentStageRecordId: number) => {
  const response = await api.post(`/applicants/${applicantId}/workflow-stages/move-next`, { currentStageRecordId });
  return response.data;
};

export const failApplicantWorkflow = async (applicantId: number, currentStageRecordId: number) => {
  const response = await api.post(`/applicants/${applicantId}/workflow-stages/fail`, { currentStageRecordId });
  return response.data;
};

export const skipWorkflowStage = async (stageRecordId: number) => {
  const response = await api.post(`/applicants/workflow-stages/${stageRecordId}/skip`);
  return response.data;
};

export const getStageApproval = async (stageRecordId: number) => {
  const response = await api.get(`/applicants/workflow-stages/${stageRecordId}/approval`);
  return response.data;
};

export const createPendingStageApproval = async (stageRecordId: number) => {
  const response = await api.post(`/applicants/workflow-stages/${stageRecordId}/approval/pending`);
  return response.data;
};

export const approveStageAction = async (stageRecordId: number, comments?: string) => {
  const response = await api.post(`/applicants/workflow-stages/${stageRecordId}/approval/approve`, { comments });
  return response.data;
};

export const rejectStageAction = async (stageRecordId: number, comments?: string) => {
  const response = await api.post(`/applicants/workflow-stages/${stageRecordId}/approval/reject`, { comments });
  return response.data;
};

export const assignApproval = async (stageRecordId: number, data: {
  assigned_user_id?: number;
  assigned_employee_id?: number;
  scheduled_at?: string;
  comments?: string;
}) => {
  const response = await api.post(`/applicants/workflow-stages/${stageRecordId}/approval/assign`, data);
  return response.data;
};

export const getMyApprovalAssignments = async () => {
  const response = await api.get("/applicants/workflow-approvals/my-assignments");
  return response.data;
};

export const getMyWorkflowStageAssignments = async () => {
  const response = await api.get("/applicants/workflow-stages/my-assignments");
  return response.data;
};

export const getPossibleApprovers = async () => {
  const response = await api.get("/applicants/possible-approvers");
  return response.data;
};

export const rollbackApplicantWorkflow = async (applicantId: number, targetStageId: number, reason: string) => {
  const response = await api.post(`/applicants/${applicantId}/workflow/rollback`, { target_stage_id: targetStageId, reason });
  return response.data;
};

export const correctStageResult = async (stageRecordId: number, data: {
  status?: string; score?: number; recommendation?: string; correction_reason: string;
}) => {
  const response = await api.post(`/applicants/workflow-stages/${stageRecordId}/correct-result`, data);
  return response.data;
};

export const failDynamicApplicant = async (applicantId: number, reason: string) => {
  const response = await api.post(`/applicants/${applicantId}/workflow/admin-fail`, { reason });
  return response.data;
};

export const createStageRecord = async (applicantId: number, workflowStageId: number, data: {
  assigned_user_id?: number;
  scheduled_at?: string;
  status?: string;
  comments?: string;
}) => {
  const response = await api.post(`/applicants/${applicantId}/workflow-stages/${workflowStageId}/create-record`, data);
  return response.data;
};

export const getAssignableUsers = async (page = 1, limit = 20, search = "") => {
  const response = await api.get("/applicants/assignable-users", { params: { page, limit, search } });
  return response.data;
};


