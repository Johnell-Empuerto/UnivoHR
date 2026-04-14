import api from "./api";

// OVERTIME - EMPLOYEE

// GET MY OVERTIME REQUESTS
export const getMyOvertime = async (
  page: number,
  limit: number,
  search: string = "",
  status: string = "",
) => {
  const response = await api.get("/overtime/my", {
    params: {
      page,
      limit,
      search,
      status,
    },
  });
  return response.data;
};

// CREATE OVERTIME REQUEST
export const createOvertime = async (data: any) => {
  const response = await api.post("/overtime", data);
  return response.data;
};

// OVERTIME - ADMIN/HR

//  GET ALL OVERTIME REQUESTS (for approval)
export const getAllOvertime = async (
  page: number,
  limit: number,
  search: string = "",
  status: string = "",
  date: string = "",
) => {
  const response = await api.get("/overtime", {
    params: {
      page,
      limit,
      search,
      status,
      date,
    },
  });
  return response.data;
};

// APPROVE OVERTIME REQUEST
export const approveOvertime = async (
  id: number,
  data: { comment?: string } = {}, //  default empty object
) => {
  const response = await api.put(`/overtime/${id}/approve`, data);
  return response.data;
};

// REJECT OVERTIME REQUEST
export const rejectOvertime = async (id: number, data: { reason: string }) => {
  const response = await api.put(`/overtime/${id}/reject`, data);
  return response.data;
};

//  GET OVERTIME REQUEST DETAILS (with approval timeline)
export const getOvertimeDetails = async (id: number) => {
  const response = await api.get(`/overtime/${id}`);
  return response.data;
};

// GET ALL ACTIVE EMPLOYEES FOR DROPDOWN
export const getActiveEmployees = async () => {
  const response = await api.get("/overtime/employees/list");
  return response.data;
};

export const isApprover = async () => {
  const response = await api.get("/overtime/is-approver");
  return response.data;
};
