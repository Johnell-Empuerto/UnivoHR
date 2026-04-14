import api from "./api";

export const employees = async (
  page: number,
  limit: number,
  search: string = "",
  status: string = "",
) => {
  const response = await api.get("/employees", {
    params: {
      page,
      limit,
      search,
      status,
    },
  });

  return response.data;
};

export const updateEmployee = async (id: number, data: any) => {
  const response = await api.put(`/employees/${id}`, data);
  return response.data;
};

export const createEmployee = async (data: any) => {
  const response = await api.post("/employees", data);
  return response.data;
};
