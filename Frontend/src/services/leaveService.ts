import api from "./api";

export const leaveService = {
  // CREATE LEAVE
  createLeave: async (data: any) => {
    const res = await api.post("/leaves", data);
    return res.data;
  },

  // GET MY LEAVES (EMPLOYEE)
  getMyLeaves: async () => {
    const res = await api.get("/leaves/my");
    return res.data;
  },

  // ADMIN - GET ALL LEAVES
  getAllLeaves: async () => {
    const res = await api.get("/leaves");
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

  // GET LEAVE CREDITS
  getLeaveCredits: async () => {
    const res = await api.get("/leaves/credits");
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
