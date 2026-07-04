import api from "./api";

export const createApprovalRequest = async (data: Record<string, unknown>) => {
  const response = await api.post("/payroll-approvals", data);
  return response.data;
};

export const getApprovalRequests = async (
  branch_id?: string,
  status?: string,
) => {
  const response = await api.get("/payroll-approvals", {
    params: { branch_id: branch_id || undefined, status: status || undefined },
  });
  return response.data;
};

export const reviewApprovalRequest = async (
  id: number,
  data: Record<string, unknown>,
) => {
  const response = await api.patch(`/payroll-approvals/${id}/review`, data);
  return response.data;
};
