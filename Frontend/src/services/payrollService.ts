import api from "./api";

//  Generate payroll (ADMIN)
export const generatePayroll = async (
  cutoff_start: string,
  cutoff_end: string,
  pay_date: string,
) => {
  const response = await api.post("/payroll/generate", {
    cutoff_start,
    cutoff_end,
    pay_date,
  });
  return response.data;
};

//  Get payroll table (ADMIN)
export const getPayroll = async (
  cutoff_start: string,
  cutoff_end: string,
  page: number,
  limit: number,
  search: string,
) => {
  const res = await api.get("/payroll", {
    params: {
      cutoff_start,
      cutoff_end,
      page,
      limit,
      search,
    },
  });

  return res.data;
};

//  Get payroll summary (cards)
export const getPayrollSummary = async (
  cutoff_start: string,
  cutoff_end: string,
) => {
  const response = await api.get("/payroll/summary", {
    params: { cutoff_start, cutoff_end },
  });
  return response.data;
};

export const markPayrollAsPaid = async (id: number) => {
  const res = await api.patch(`/payroll/${id}/pay`);
  return res.data;
};

// 🔧 Get payroll settings
export const getPayrollSettings = async () => {
  const response = await api.get("/payroll/settings");
  return response.data;
};

//  Update payroll settings
export const updatePayrollSettings = async (settings: any) => {
  const response = await api.put("/payroll/settings", settings);
  return response.data;
};

export const markAllPayrollAsPaid = async (
  cutoff_start: string,
  cutoff_end: string,
) => {
  const res = await api.patch("/payroll/mark-all-paid", {
    cutoff_start,
    cutoff_end,
  });
  return res.data;
};

export const getEmployeeSalary = async (
  page: number,
  limit: number,
  search: string,
) => {
  const res = await api.get("/payroll/salary", {
    params: {
      page,
      limit,
      search,
    },
  });

  return res.data;
};
export const updateEmployeeSalary = async (id: number, data: any) => {
  const res = await api.put(`/payroll/salary/${id}`, data);
  return res.data;
};

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

export const deletePayrollByCutoff = async (
  cutoff_start: string,
  cutoff_end: string,
  pay_date: string,
) => {
  const res = await api.delete("/payroll/delete-cutoff", {
    data: { cutoff_start, cutoff_end, pay_date },
  });

  return res.data;
};

export const getMyPayroll = async (
  cutoff_start: string,
  cutoff_end: string,
) => {
  const response = await api.get("/payroll/my", {
    params: { cutoff_start, cutoff_end },
  });
  return response.data;
};

// Get my salary details (employee)
export const getMySalaryDetails = async () => {
  const response = await api.get("/payroll/my/salary");
  return response.data;
};

export const downloadPayslip = async (id: number) => {
  const response = await api.get(`/payroll/${id}/payslip`, {
    responseType: "blob",
  });

  return response.data;
};

export const getPayrollById = async (id: number | string) => {
  const res = await api.get(`/payroll/${id}`);
  return res.data;
};
