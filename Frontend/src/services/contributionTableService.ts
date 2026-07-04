import api from "./api";

export const getSssTable = () => api.get("/contribution-tables/sss").then((r) => r.data.data);
export const createSssRow = (data: Record<string, unknown>) => api.post("/contribution-tables/sss", data).then((r) => r.data.data);
export const updateSssRow = (id: number, data: Record<string, unknown>) => api.put(`/contribution-tables/sss/${id}`, data).then((r) => r.data.data);
export const deleteSssRow = (id: number) => api.delete(`/contribution-tables/sss/${id}`).then((r) => r.data);

export const getPhilHealthTable = () => api.get("/contribution-tables/philhealth").then((r) => r.data.data);
export const createPhilHealthRow = (data: Record<string, unknown>) => api.post("/contribution-tables/philhealth", data).then((r) => r.data.data);
export const updatePhilHealthRow = (id: number, data: Record<string, unknown>) => api.put(`/contribution-tables/philhealth/${id}`, data).then((r) => r.data.data);
export const deletePhilHealthRow = (id: number) => api.delete(`/contribution-tables/philhealth/${id}`).then((r) => r.data);

export const getPagIbigTable = () => api.get("/contribution-tables/pagibig").then((r) => r.data.data);
export const createPagIbigRow = (data: Record<string, unknown>) => api.post("/contribution-tables/pagibig", data).then((r) => r.data.data);
export const updatePagIbigRow = (id: number, data: Record<string, unknown>) => api.put(`/contribution-tables/pagibig/${id}`, data).then((r) => r.data.data);
export const deletePagIbigRow = (id: number) => api.delete(`/contribution-tables/pagibig/${id}`).then((r) => r.data);

export const getWithholdingTaxTable = () => api.get("/contribution-tables/withholding-tax").then((r) => r.data.data);
export const createTaxRow = (data: Record<string, unknown>) => api.post("/contribution-tables/withholding-tax", data).then((r) => r.data.data);
export const updateTaxRow = (id: number, data: Record<string, unknown>) => api.put(`/contribution-tables/withholding-tax/${id}`, data).then((r) => r.data.data);
export const deleteTaxRow = (id: number) => api.delete(`/contribution-tables/withholding-tax/${id}`).then((r) => r.data);
