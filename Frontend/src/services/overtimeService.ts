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
export const createOvertime = async (data: Record<string, unknown>) => {
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
export const deleteOvertime = async (id: number) => {
  const response = await api.delete(`/overtime/${id}`);
  return response.data;
};

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

export interface EmployeeSearchResult {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string | null;
  position: string | null;
  employment_status: string | null;
  status: string;
  branch_id: number | null;
  branch_name: string | null;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const searchEmployeesPaginated = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  hasUser?: boolean;
}): Promise<{ data: EmployeeSearchResult[]; pagination: PaginationInfo }> => {
  const response = await api.get("/overtime/employees/search", { params });
  return response.data;
};

export const isApprover = async () => {
  const response = await api.get("/overtime/is-approver");
  return response.data;
};
