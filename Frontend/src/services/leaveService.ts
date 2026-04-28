import api from "./api";

export const leaveService = {
  // CREATE LEAVE
  createLeave: async (data: any) => {
    const res = await api.post("/leaves", data);
    return res.data;
  },

  // GET MY LEAVES (EMPLOYEE)
  getMyLeaves: async (page = 1, limit = 10, status = "") => {
    const res = await api.get(
      `/leaves/my?page=${page}&limit=${limit}&status=${status}`,
    );
    return res.data;
  },

  // ADMIN - GET ALL LEAVES
  getAllLeaves: async (
    page = 1,
    limit = 10,
    search = "",
    status = "",
    type = "",
  ) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (type) params.append("type", type);

    const res = await api.get(`/leaves?${params.toString()}`);
    return res.data;
  },

  // ADMIN - UPDATE STATUS
  updateLeaveStatus: async (
    id: number,
    status: string,
    rejectionReason?: string,
  ) => {
    const payload: any = { status };
    if (status === "REJECTED" && rejectionReason) {
      payload.rejection_reason = rejectionReason;
    }
    const res = await api.put(`/leaves/${id}/status`, payload);
    return res.data;
  },

  // GET LEAVE CREDITS (MY CREDITS)
  getLeaveCredits: async () => {
    const res = await api.get("/leaves/credits");
    return res.data;
  },

  // GET ALL EMPLOYEE CREDITS (ADMIN/HR_ADMIN)
  getAllEmployeeCredits: async (page = 1, limit = 10, search = "", department = "") => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (department) params.append("department", department);

    const res = await api.get(`/leaves/credits/all?${params.toString()}`);
    return res.data;
  },

  // GET SINGLE EMPLOYEE CREDITS (ADMIN/HR_ADMIN)
  getEmployeeCredits: async (employeeId: number) => {
    const res = await api.get(`/leaves/credits/${employeeId}`);
    return res.data;
  },

  // UPDATE EMPLOYEE CREDITS (ADMIN/HR_ADMIN)
  updateEmployeeCredits: async (employeeId: number, data: any) => {
    const res = await api.put(`/leaves/credits/${employeeId}`, data);
    return res.data;
  },
};

//  SALARY
export const getEmployeeSalary = async () => {
  const res = await api.get("/payroll/salary");
  return res.data;
};

export const updateEmployeeSalary = async (id: number, data: any) => {
  const res = await api.put(`/payroll/salary/${id}`, data);
  return res.data;
};

//  DEDUCTIONS
export const getDeductions = async (employeeId: number) => {
  const res = await api.get(`/payroll/deductions/${employeeId}`);
  return res.data;
};

export const createDeduction = async (data: any) => {
  const res = await api.post(`/payroll/deductions`, data);
  return res.data;
};

export const updateDeduction = async (id: number, data: any) => {
  const res = await api.put(`/payroll/deductions/${id}`, data);
  return res.data;
};

export const deleteDeduction = async (id: number) => {
  const res = await api.delete(`/payroll/deductions/${id}`);
  return res.data;
};

//  LEAVE TYPES (Conversion Rules)
export const getLeaveTypes = async () => {
  const res = await api.get("/leave-conversion/types");
  return res.data;
};

export const updateLeaveType = async (id: number, data: any) => {
  const res = await api.put(`/leave-conversion/types/${id}`, data);
  return res.data;
};

// COMPANY SETTINGS (SIL / Global Rules)
export const getConversionSettings = async () => {
  const res = await api.get("/leave-conversion/settings");
  return res.data;
};

export const updateConversionSettings = async (data: any) => {
  const res = await api.put("/leave-conversion/settings", data);
  return res.data;
};

//  SAVE ALL (Bulk Update)
export const saveAllConversionSettings = async (
  leaveTypes: any[],
  settings: any,
) => {
  const res = await api.post("/leave-conversion/save-all", {
    leaveTypes,
    settings,
  });
  return res.data;
};
