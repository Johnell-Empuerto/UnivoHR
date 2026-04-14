// services/approverService.ts
import api from "./api";

// GET ALL APPROVER MAPPINGS
export const getApprovers = async (
  page: number,
  limit: number,
  search: string = "",
  type: string = "",
) => {
  const response = await api.get("/overtime/approvers", {
    params: { page, limit, search, type },
  });
  return response.data;
};

// CREATE APPROVER MAPPING
export const createApprover = async (data: {
  employee_id: number;
  approver_id: number;
  approval_type: string;
}) => {
  const response = await api.post("/overtime/approvers", data);
  return response.data;
};

// UPDATE APPROVER MAPPING
export const updateApprover = async (
  id: number,
  data: {
    employee_id: number;
    approver_id: number;
    approval_type: string;
  },
) => {
  const response = await api.put(`/overtime/approvers/${id}`, data);
  return response.data;
};

// DELETE APPROVER MAPPING
export const deleteApprover = async (id: number) => {
  const response = await api.delete(`/overtime/approvers/${id}`);
  return response.data;
};
