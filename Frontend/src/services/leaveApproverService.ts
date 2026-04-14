// services/leaveApproverService.ts
import api from "./api";

// GET ALL LEAVE APPROVER MAPPINGS
export const getLeaveApprovers = async (
  page: number,
  limit: number,
  search: string = "",
  type: string = "LEAVE",
) => {
  const response = await api.get("/overtime/approvers", {
    params: { page, limit, search, type },
  });
  return response.data;
};

// CREATE LEAVE APPROVER MAPPING
export const createLeaveApprover = async (data: {
  employee_id: number;
  approver_id: number;
  approval_type: string;
}) => {
  const response = await api.post("/overtime/approvers", data);
  return response.data;
};

// UPDATE LEAVE APPROVER MAPPING
export const updateLeaveApprover = async (
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

// DELETE LEAVE APPROVER MAPPING
export const deleteLeaveApprover = async (id: number) => {
  const response = await api.delete(`/overtime/approvers/${id}`);
  return response.data;
};
