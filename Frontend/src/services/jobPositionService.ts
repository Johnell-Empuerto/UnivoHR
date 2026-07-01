import api from "./api";

export const getJobPositions = async (page = 1, limit = 10, search = "", status = "") => {
  const response = await api.get("/job-positions", { params: { page, limit, search, status } });
  return response.data;
};

export const getActiveJobPositions = async () => {
  const response = await api.get("/job-positions/active");
  return response.data;
};

export const getJobPositionById = async (id: number) => {
  const response = await api.get(`/job-positions/${id}`);
  return response.data;
};

export const createJobPosition = async (data: Record<string, unknown>) => {
  const response = await api.post("/job-positions", data);
  return response.data;
};

export const updateJobPosition = async (id: number, data: Record<string, unknown>) => {
  const response = await api.put(`/job-positions/${id}`, data);
  return response.data;
};

export const deleteJobPosition = async (id: number) => {
  const response = await api.delete(`/job-positions/${id}`);
  return response.data;
};
