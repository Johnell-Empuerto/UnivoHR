import api from "./api";

export const getBranches = async () => {
  const response = await api.get("/branches");
  return response.data;
};

export const getActiveBranches = async () => {
  const response = await api.get("/branches/active");
  return response.data;
};

export const getBranchById = async (id: number) => {
  const response = await api.get(`/branches/${id}`);
  return response.data;
};

export const createBranch = async (data: any) => {
  const response = await api.post("/branches", data);
  return response.data;
};

export const updateBranch = async (id: number, data: any) => {
  const response = await api.put(`/branches/${id}`, data);
  return response.data;
};

export const setBranchActive = async (id: number, is_active: boolean) => {
  const response = await api.patch(`/branches/${id}/status`, { is_active });
  return response.data;
};
