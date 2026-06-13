import api from "./api";

export const getFriendlyKpiError = (err: any, fallback = "Unable to complete action.") => {
  const message =
    err?.response?.data?.message ||
    err?.message ||
    fallback;

  if (message.includes("No scores saved")) {
    return "Please score at least one KPI item before submitting.";
  }

  if (message.includes("employee_code") || message.includes("not-null constraint")) {
    return "Unable to approve evaluation. Employee record update failed.";
  }

  if (message.includes("foreign key constraint")) {
    return "Unable to complete action because related employee or KPI data was not found.";
  }

  if (message.includes("already approved")) {
    return message;
  }

  return message || fallback;
};

export const getKpiTemplates = async (page = 1, limit = 10, search = "") => {
  const response = await api.get("/kpi/templates", { params: { page, limit, search } });
  return response.data;
};

export const getKpiTemplateById = async (id: number) => {
  const response = await api.get(`/kpi/templates/${id}`);
  return response.data;
};

export const createKpiTemplate = async (data: any) => {
  const response = await api.post("/kpi/templates", data);
  return response.data;
};

export const updateKpiTemplate = async (id: number, data: any) => {
  const response = await api.put(`/kpi/templates/${id}`, data);
  return response.data;
};

export const toggleKpiTemplate = async (id: number) => {
  const response = await api.patch(`/kpi/templates/${id}/toggle`);
  return response.data;
};

export const deleteKpiTemplate = async (id: number) => {
  const response = await api.delete(`/kpi/templates/${id}`);
  return response.data;
};

export const getKpiTemplateItems = async (templateId: number) => {
  const response = await api.get(`/kpi/templates/${templateId}/items`);
  return response.data;
};

export const addKpiTemplateItem = async (templateId: number, data: any) => {
  const response = await api.post(`/kpi/templates/${templateId}/items`, data);
  return response.data;
};

export const updateKpiTemplateItem = async (itemId: number, data: any) => {
  const response = await api.put(`/kpi/templates/items/${itemId}`, data);
  return response.data;
};

export const deleteKpiTemplateItem = async (itemId: number) => {
  const response = await api.delete(`/kpi/templates/items/${itemId}`);
  return response.data;
};

export const getActiveKpiTemplates = async () => {
  const response = await api.get("/kpi/templates/active");
  return response.data;
};

export const assignKpiEvaluation = async (data: any) => {
  const response = await api.post("/kpi/evaluations/assign", data);
  return response.data;
};

export const getKpiEvaluationById = async (id: number) => {
  const response = await api.get(`/kpi/evaluations/${id}`);
  return response.data;
};

export const getMyKpiEvaluations = async (status = "") => {
  const response = await api.get("/kpi/evaluations/my-evaluations", { params: { status } });
  return response.data;
};

export const getMyKpiAssignments = async (status = "", page = 1, limit = 10) => {
  const response = await api.get("/kpi/evaluations/my-assignments", { params: { status, page, limit } });
  return response.data;
};

export const getKpiHrView = async (search = "", status = "", page = 1, limit = 10) => {
  const response = await api.get("/kpi/evaluations/hr-view", { params: { search, status, page, limit } });
  return response.data;
};

export const saveKpiScores = async (evaluationId: number, data: any) => {
  const response = await api.post(`/kpi/evaluations/${evaluationId}/scores`, data);
  return response.data;
};

export const submitKpiEvaluation = async (evaluationId: number, data: any) => {
  const response = await api.post(`/kpi/evaluations/${evaluationId}/submit`, data);
  return response.data;
};

export const saveKpiSelfEvaluation = async (evaluationId: number, data: any) => {
  const response = await api.post(`/kpi/evaluations/${evaluationId}/self-evaluation`, data);
  return response.data;
};

export const approveKpiEvaluation = async (evaluationId: number, data: any) => {
  const response = await api.post(`/kpi/evaluations/${evaluationId}/approve`, data);
  return response.data;
};

export const rejectKpiEvaluation = async (evaluationId: number, data: any) => {
  const response = await api.post(`/kpi/evaluations/${evaluationId}/reject`, data);
  return response.data;
};

export const getKpiHistory = async (employeeId?: number, page = 1, limit = 10, search = "") => {
  const response = await api.get("/kpi/evaluations/history", { params: { employee_id: employeeId, page, limit, search } });
  return response.data;
};

export const bulkAssignKpiEvaluations = async (data: {
  employee_ids: number[];
  evaluator_id: number;
  template_id: number;
  evaluation_period_start: string;
  evaluation_period_end: string;
}) => {
  const response = await api.post("/kpi/evaluations/bulk-assign", data);
  return response.data;
};

export const getKpiPendingCount = async () => {
  const response = await api.get("/kpi/evaluations/pending-count");
  return response.data;
};

export const getMyPerformanceSummary = async () => {
  const response = await api.get("/employee/performance/summary");
  return response.data;
};

export const getMyProbationInfo = async () => {
  const response = await api.get("/employee/performance/probation");
  return response.data;
};

export const getEmployees = async (status = "") => {
  const response = await api.get("/employees", { params: { status, limit: 10000 } });
  return response.data;
};
