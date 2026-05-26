import api from "./api";

export const getHrPolicies = async () => {
  const response = await api.get("/hr-policies");
  return response.data;
};

export const getHrPolicyById = async (id: number) => {
  const response = await api.get(`/hr-policies/${id}`);
  return response.data;
};

export const createHrPolicy = async (data: {
  title: string;
  category: string;
  content: string;
}) => {
  const response = await api.post("/hr-policies", data);
  return response.data;
};

export const updateHrPolicy = async (
  id: number,
  data: { title: string; category: string; content: string },
) => {
  const response = await api.put(`/hr-policies/${id}`, data);
  return response.data;
};

export const deleteHrPolicy = async (id: number) => {
  const response = await api.delete(`/hr-policies/${id}`);
  return response.data;
};

export const setHrPolicyStatus = async (id: number, is_active: boolean) => {
  const response = await api.patch(`/hr-policies/${id}/status`, { is_active });
  return response.data;
};
