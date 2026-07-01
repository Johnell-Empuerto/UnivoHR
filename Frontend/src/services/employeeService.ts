import api from "./api";

export const employees = async (
  page: number,
  limit: number,
  search: string = "",
  status: string = "",
  branch_id: string = "",
) => {
  const response = await api.get("/employees", {
    params: {
      page,
      limit,
      search,
      status,
      branch_id,
    },
  });

  return response.data;
};

export const updateEmployee = async (id: number, data: Record<string, unknown>) => {
  const response = await api.put(`/employees/${id}`, data);
  return response.data;
};

export const createEmployee = async (data: Record<string, unknown>) => {
  const response = await api.post("/employees", data);
  return response.data;
};

export const getDueForRegularization = async () => {
  const response = await api.get("/employees/regularization/due");
  return response.data;
};

export const approveRegularization = async (id: number) => {
  const response = await api.post(`/employees/regularization/${id}/approve`);
  return response.data;
};

export const getEmploymentStats = async () => {
  const response = await api.get("/employees/employment-stats");
  return response.data;
};

export const downloadEmployeeImportTemplate = async () => {
  const response = await api.get("/employees/import/template", {
    responseType: "blob",
    timeout: 30000,
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "employee_import_template.xlsx");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
};

export const validateEmployeeImport = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/employees/import/validate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return response.data;
};

export const commitEmployeeImport = async (batchId: number) => {
  const response = await api.post("/employees/import/commit", { batchId }, { timeout: 120000 });
  return response.data;
};

export const getEmployeeImportHistory = async () => {
  const response = await api.get("/employees/import/history");
  return response.data;
};

export const downloadEmployeeImportErrors = async (batchId: number) => {
  const response = await api.get(`/employees/import/${batchId}/errors`, {
    responseType: "blob",
    timeout: 30000,
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `employee_import_errors_batch_${batchId}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
};
